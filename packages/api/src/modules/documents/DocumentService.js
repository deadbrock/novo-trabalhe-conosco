import { env } from '../../config/env.js'
import { prisma, notDeleted, softDeleteData } from '../../lib/prisma.js'
import { formatCpf } from '../../utils/candidateProfile.js'
import { refreshDocumentationStatus } from '../../services/applicationDocumentation.service.js'
import { getSignatureProvider } from '../signatures/providers/index.js'
import { documentRepository } from './DocumentRepository.js'
import {
  DOCUMENT_STATUS_LABELS,
  EVENT_LABELS,
  SIGNABLE_STATUSES,
  TERMINAL_STATUSES,
  getDocumentTypeConfig,
} from './documentRegistry.js'
import { saveCandidateDocumentFile, streamCandidateDocumentFile } from './documentStorage.js'
import { logDocuSignWebhook } from '../signatures/providers/docusign/DocuSignLogger.js'
import { generateEthnicDeclarationPdfForSigning } from '../../services/candidateDocumentPdf.service.js'
import {
  canSyncEnvelopeWithDocuSign,
  getCachedEnvelopeSync,
  isDocuSignPollingError,
  isDocuSignRateLimited,
  markDocuSignRateLimited,
  setCachedEnvelopeSync,
} from '../signatures/providers/docusign/DocuSignSyncThrottle.js'

function mapDocument(record) {
  const typeConfig = getDocumentTypeConfig(record.documentType)
  return {
    id: record.id,
    candidateId: record.candidateId,
    applicationId: record.applicationId,
    documentType: record.documentType,
    documentLabel: typeConfig?.label || record.documentType,
    provider: record.provider,
    providerEnvelopeId: record.providerEnvelopeId,
    status: record.status,
    statusLabel: DOCUMENT_STATUS_LABELS[record.status] || record.status,
    signedPdfPath: record.signedPdfPath,
    certificatePdfPath: record.certificatePdfPath,
    signedAt: record.signedAt?.toISOString() || null,
    raceCategory: record.raceCategory || null,
    raceDescription: record.raceDescription || '',
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    candidateName: record.candidate?.name || '',
    candidateEmail: record.candidate?.user?.email || '',
    jobTitle: record.application?.job?.title || '',
    canSign: SIGNABLE_STATUSES.includes(record.status),
    isCompleted: record.status === 'SIGNED',
  }
}

function buildSigningReturnUrl(returnUrl, documentId) {
  const fallback = `${env.appUrl}/portal-do-candidato/assinatura/retorno`
  const base = (returnUrl || fallback).trim() || fallback

  try {
    const url = new URL(base)
    if (documentId && !url.searchParams.has('documentId')) {
      url.searchParams.set('documentId', documentId)
    }
    return url.toString()
  } catch {
    const separator = base.includes('?') ? '&' : '?'
    return `${base}${separator}documentId=${encodeURIComponent(documentId)}`
  }
}

function mapTimelineEvent(eventRecord) {
  return {
    id: eventRecord.id,
    event: eventRecord.event,
    label: EVENT_LABELS[eventRecord.event] || eventRecord.event,
    payload: eventRecord.payload,
    createdAt: eventRecord.createdAt.toISOString(),
  }
}

async function attachToDocumentationChecklist(document, pdfBuffer) {
  const typeConfig = getDocumentTypeConfig(document.documentType)
  if (!typeConfig?.documentationItemSlug || !document.application?.documentation) return

  const item = document.application.documentation.items.find(
    (entry) => entry.slug === typeConfig.documentationItemSlug,
  )
  if (!item) return

  if (item.documentId) {
    const previous = await prisma.document.findFirst({ where: { id: item.documentId } })
    if (previous) {
      const { storageService } = await import('../../storage/index.js')
      await storageService.delete(previous.storageKey).catch(() => {})
      await prisma.document.update({ where: { id: previous.id }, data: softDeleteData() })
    }
  }

  const stored = await saveCandidateDocumentFile(
    document.candidateId,
    typeConfig.fileBaseName,
    pdfBuffer,
  )

  const fileRecord = await prisma.document.create({
    data: {
      ownerType: 'APPLICATION_DOCUMENTATION',
      ownerId: item.id,
      candidateId: document.candidateId,
      type: 'application_documentation',
      storageKey: stored.storageKey,
      provider: 'LOCAL',
      originalName: stored.fileName,
      mimeType: 'application/pdf',
      size: stored.size,
    },
  })

  await prisma.applicationDocumentationItem.update({
    where: { id: item.id },
    data: {
      documentId: fileRecord.id,
      status: 'UPLOADED',
      rejectionReason: '',
      reviewedById: null,
      reviewedAt: null,
    },
  })

  await refreshDocumentationStatus(document.application.documentation.id)
}

export class DocumentService {
  constructor(repository = documentRepository, providerFactory = getSignatureProvider) {
    this.repository = repository
    this.providerFactory = providerFactory
  }

  getProvider(name = 'docusign') {
    return this.providerFactory(name)
  }

  async getDocumentForCandidate(userId, documentId) {
    const record = await this.repository.findByCandidateUserId(userId, documentId)
    if (!record) throw new Error('NOT_FOUND')
    return mapDocument(record)
  }

  async getDocumentStatus(documentId, { userId = null, candidateId = null } = {}) {
    let record
    if (userId) {
      record = await this.repository.findByCandidateUserId(userId, documentId)
    } else if (candidateId) {
      record = await this.repository.findById(documentId)
      if (record?.candidateId !== candidateId) record = null
    } else {
      record = await this.repository.findById(documentId)
    }
    if (!record) throw new Error('NOT_FOUND')

    let providerSigned = false
    let finalizeError = null
    let providerSyncPaused = isDocuSignRateLimited()

    if (record.providerEnvelopeId && !TERMINAL_STATUSES.includes(record.status)) {
      const cachedSync = getCachedEnvelopeSync(record.id)

      if (providerSyncPaused) {
        providerSigned = cachedSync?.providerSigned || false
      } else if (cachedSync) {
        providerSigned = cachedSync.providerSigned || false
      } else if (canSyncEnvelopeWithDocuSign(record.id)) {
        try {
          const provider = this.getProvider(record.provider)
          const signerContext = {
            clientUserId: record.candidate?.user?.id || null,
            email: record.candidate?.user?.email || null,
          }

          providerSigned = await provider.isSigningComplete(record.providerEnvelopeId, signerContext)

          setCachedEnvelopeSync(record.id, { providerSigned })

          if (providerSigned) {
            try {
              record = await this.finalizeSignedDocument(record)
            } catch (error) {
              finalizeError = error.message || 'Erro ao finalizar documento assinado.'
              console.error('[DocumentService] finalizeSignedDocument failed:', finalizeError)
            }
          }
        } catch (error) {
          if (isDocuSignPollingError(error)) {
            markDocuSignRateLimited()
            providerSyncPaused = true
            providerSigned = cachedSync?.providerSigned || false
          }
          console.error('[DocumentService] provider sync failed:', error.message)
        }
      }
    }

    const isCompleted = record.status === 'SIGNED'

    return {
      id: record.id,
      status: record.status,
      statusLabel: DOCUMENT_STATUS_LABELS[record.status] || record.status,
      signedAt: record.signedAt?.toISOString() || null,
      canSign: SIGNABLE_STATUSES.includes(record.status),
      isCompleted,
      providerSigned,
      needsManualFinalize: providerSigned && !isCompleted,
      finalizeError,
      providerSyncPaused,
    }
  }

  async initiateSign(documentId, userId, { returnUrl } = {}) {
    let record = await this.repository.findByCandidateUserId(userId, documentId)
    if (!record) throw new Error('NOT_FOUND')
    if (record.status === 'SIGNED') throw new Error('ALREADY_SIGNED')
    if (!SIGNABLE_STATUSES.includes(record.status) && record.status !== 'ERROR') {
      throw new Error('INVALID_STATUS')
    }

    const typeConfig = getDocumentTypeConfig(record.documentType)
    if (!typeConfig) throw new Error('INVALID_DOCUMENT_TYPE')

    const provider = this.getProvider(record.provider || 'docusign')
    if (!provider.isConfigured()) throw new Error('DOCUSIGN_NOT_CONFIGURED')

    const candidate = record.candidate
    const signerEmail = candidate.user.email
    const signerName = candidate.name
    const clientUserId = candidate.user.id

    let envelopeId = record.providerEnvelopeId

    if (envelopeId && record.documentType === 'ETHNIC_DECLARATION') {
      try {
        await provider.voidEnvelope(envelopeId)
      } catch (error) {
        console.warn('[DocumentService] void envelope failed:', error.message)
      }

      envelopeId = null
      record = await this.repository.update(record.id, {
        providerEnvelopeId: '',
        status: 'PENDING',
      })
    }

    if (!envelopeId) {
      if (record.documentType === 'ETHNIC_DECLARATION') {
        const pdfBuffer = await generateEthnicDeclarationPdfForSigning({
          candidate,
          raceCategory: record.raceCategory,
          raceDescription: record.raceDescription,
        })

        const envelope = await provider.createEnvelope({
          email: signerEmail,
          name: signerName,
          clientUserId,
          documentName: typeConfig.label,
          documentBase64: pdfBuffer.toString('base64'),
          emailSubject: typeConfig.emailSubject,
        })

        envelopeId = envelope.envelopeId
      } else {
        if (!typeConfig.templateId) {
          throw new Error('TEMPLATE_NOT_CONFIGURED')
        }

        const envelope = await provider.createEnvelope({
          email: signerEmail,
          name: signerName,
          clientUserId,
          documentName: typeConfig.label,
          templateId: typeConfig.templateId,
          templateRole: typeConfig.templateRole,
          emailSubject: typeConfig.emailSubject,
        })

        envelopeId = envelope.envelopeId
      }

      record = await this.repository.update(record.id, {
        provider: provider.constructor.providerName,
        providerEnvelopeId: envelopeId,
        status: 'SENT',
      })

      await this.repository.addEvent(record.id, 'ENVELOPE_CREATED', { envelopeId })
      await this.repository.addEvent(record.id, 'ENVELOPE_SENT', { envelopeId })
      await this.repository.addEvent(record.id, 'PDF_GENERATED', {
        envelopeId,
        source: record.documentType === 'ETHNIC_DECLARATION' ? 'local_pdf' : 'docusign_template',
      })
    }

    const signingReturnUrl = buildSigningReturnUrl(returnUrl, record.id)

    const signingUrl = await provider.getEmbeddedSigningUrl({
      envelopeId,
      email: signerEmail,
      name: signerName,
      clientUserId,
      returnUrl: signingReturnUrl,
    })

    return {
      success: true,
      signingUrl,
      documentId: record.id,
      envelopeId,
    }
  }

  async finalizeSignedDocument(record) {
    if (!record.providerEnvelopeId) throw new Error('ENVELOPE_NOT_FOUND')

    const provider = this.getProvider(record.provider || 'docusign')
    const typeConfig = getDocumentTypeConfig(record.documentType)

    const signedPdf = await provider.downloadSignedPdf(record.providerEnvelopeId)
    let certificatePdf = null

    try {
      certificatePdf = await provider.downloadCertificate(record.providerEnvelopeId)
    } catch {
      certificatePdf = null
    }

    const signedStored = await saveCandidateDocumentFile(
      record.candidateId,
      typeConfig?.fileBaseName || record.documentType.toLowerCase(),
      signedPdf,
    )

    let certificatePath = ''
    if (certificatePdf) {
      const certStored = await saveCandidateDocumentFile(
        record.candidateId,
        typeConfig?.fileBaseName || record.documentType.toLowerCase(),
        certificatePdf,
        { certificate: true },
      )
      certificatePath = certStored.storageKey
      await this.repository.addEvent(record.id, 'CERTIFICATE_STORED', {
        storageKey: certificatePath,
      })
    }

    const updated = await this.repository.update(record.id, {
      status: 'SIGNED',
      signedPdfPath: signedStored.storageKey,
      certificatePdfPath: certificatePath,
      signedAt: new Date(),
    })

    await this.repository.addEvent(record.id, 'ENVELOPE_SIGNED', {
      envelopeId: record.providerEnvelopeId,
    })
    await this.repository.addEvent(record.id, 'PDF_STORED', {
      storageKey: signedStored.storageKey,
    })

    await attachToDocumentationChecklist(updated, signedPdf).catch((error) => {
      console.error('[DocumentService] checklist attach failed:', error.message)
    })

    return updated
  }

  async downloadSignedPdf(documentId, { userId = null, staff = false } = {}) {
    let record
    if (staff) {
      record = await this.repository.findById(documentId)
    } else {
      record = await this.repository.findByCandidateUserId(userId, documentId)
    }
    if (!record) throw new Error('NOT_FOUND')
    if (!record.signedPdfPath) throw new Error('FILE_NOT_FOUND')

    const file = await streamCandidateDocumentFile(record.signedPdfPath)
    const typeConfig = getDocumentTypeConfig(record.documentType)
    return {
      stream: file.stream,
      mimeType: 'application/pdf',
      fileName: `${typeConfig?.fileBaseName || 'documento'}.pdf`,
    }
  }

  async downloadCertificate(documentId, { userId = null, staff = false } = {}) {
    let record
    if (staff) {
      record = await this.repository.findById(documentId)
    } else {
      record = await this.repository.findByCandidateUserId(userId, documentId)
    }
    if (!record) throw new Error('NOT_FOUND')
    if (!record.certificatePdfPath) throw new Error('CERTIFICATE_NOT_FOUND')

    const file = await streamCandidateDocumentFile(record.certificatePdfPath)
    const typeConfig = getDocumentTypeConfig(record.documentType)
    return {
      stream: file.stream,
      mimeType: 'application/pdf',
      fileName: `${typeConfig?.fileBaseName || 'documento'}_certificate.pdf`,
    }
  }

  async listCandidateDocuments(userId) {
    const profile = await prisma.candidateProfile.findFirst({
      where: { userId, ...notDeleted() },
      select: { id: true },
    })
    if (!profile) return []

    const records = await this.repository.listByCandidateId(profile.id)
    return records.map(mapDocument)
  }

  async listAdminDocuments(candidateId) {
    const records = await this.repository.listByCandidateId(candidateId)
    return records.map(mapDocument)
  }

  async getDocumentTimeline(documentId) {
    const record = await this.repository.findById(documentId)
    if (!record) throw new Error('NOT_FOUND')

    const events = record.events?.length
      ? record.events
      : await this.repository.listEvents(documentId)

    return {
      document: mapDocument(record),
      timeline: events.map(mapTimelineEvent),
    }
  }

  async createOrUpdateDocument({
    candidateId,
    applicationId,
    documentType,
    provider = 'docusign',
    raceCategory = null,
    raceDescription = '',
  }) {
    const existing = await this.repository.findByCandidateAndType(candidateId, documentType)

    if (existing?.status === 'SIGNED') {
      throw new Error('ALREADY_SIGNED')
    }

    if (existing) {
      const updated = await this.repository.update(existing.id, {
        applicationId,
        raceCategory,
        raceDescription,
        provider,
        status: existing.providerEnvelopeId ? existing.status : 'PENDING',
      })
      return mapDocument(updated)
    }

    const created = await this.repository.create({
      candidateId,
      applicationId,
      documentType,
      provider,
      raceCategory,
      raceDescription,
      status: 'PENDING',
    })

    await this.repository.addEvent(created.id, 'DOCUMENT_CREATED', {
      documentType,
      provider,
    })

    return mapDocument(created)
  }

  async handleWebhook(payload) {
    logDocuSignWebhook(payload?.event || 'unknown', { envelopeId: payload?.data?.envelopeId })

    const envelopeId =
      payload?.data?.envelopeId ||
      payload?.envelopeId ||
      payload?.data?.envelopeSummary?.envelopeId

    if (!envelopeId) return { handled: false }

    const record = await this.repository.findByEnvelopeId(envelopeId)
    if (!record) return { handled: false, envelopeId }

    await this.repository.addEvent(record.id, 'WEBHOOK_RECEIVED', payload)

    const event = String(payload?.event || '').toLowerCase()

    if (event.includes('completed') || event.includes('signed')) {
      await this.finalizeSignedDocument(record)
      return { handled: true, documentId: record.id, status: 'SIGNED' }
    }

    if (event.includes('declined')) {
      await this.repository.update(record.id, { status: 'DECLINED' })
      await this.repository.addEvent(record.id, 'ENVELOPE_DECLINED', payload)
      return { handled: true, documentId: record.id, status: 'DECLINED' }
    }

    if (event.includes('voided')) {
      await this.repository.update(record.id, { status: 'VOIDED' })
      await this.repository.addEvent(record.id, 'ENVELOPE_VOIDED', payload)
      return { handled: true, documentId: record.id, status: 'VOIDED' }
    }

    if (event.includes('delivered')) {
      await this.repository.update(record.id, { status: 'DELIVERED' })
      await this.repository.addEvent(record.id, 'ENVELOPE_DELIVERED', payload)
      return { handled: true, documentId: record.id, status: 'DELIVERED' }
    }

    if (event.includes('viewed') || event.includes('viewing')) {
      await this.repository.update(record.id, { status: 'VIEWED' })
      await this.repository.addEvent(record.id, 'ENVELOPE_VIEWED', payload)
      return { handled: true, documentId: record.id, status: 'VIEWED' }
    }

    return { handled: true, documentId: record.id, status: record.status }
  }
}

export const documentService = new DocumentService()

export function buildCandidateSummary(record) {
  return {
    name: record?.name || '',
    cpf: formatCpf(record?.cpf),
    city: record?.city || '—',
  }
}
