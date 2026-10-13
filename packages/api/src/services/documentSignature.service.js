import fs from 'node:fs'
import { prisma, notDeleted, softDeleteData } from '../lib/prisma.js'
import { env } from '../config/env.js'
import { storageService } from '../storage/index.js'
import { createAuditLog } from './audit.service.js'
import { DOCUMENTATION_STAGE } from '../utils/pipelineStages.js'
import {
  getSignatureDocumentType,
  PENDING_SIGNATURE_STATUSES,
  SIGNATURE_STATUS_LABELS,
} from '../constants/signatureDocuments.js'
import {
  DOCUMENT_STATUS_LABELS,
  SIGNABLE_STATUSES,
  getDocumentTypeConfig,
} from '../modules/documents/documentRegistry.js'
import {
  assertDocuSignConfigured,
  createEmbeddedSigningEnvelope,
  createRecipientSigningUrl,
  downloadCompletedDocument,
  getEnvelopeStatus,
  mapDocuSignStatusToInternal,
} from './docusign.client.js'

const signatureInclude = {
  application: {
    include: {
      candidate: {
        include: { user: { select: { id: true, email: true } } },
      },
      job: { select: { id: true, title: true } },
      documentation: {
        include: {
          items: { where: notDeleted() },
        },
      },
    },
  },
  documentationItem: true,
  signedDocument: true,
}

function mapSignatureRequest(record) {
  return {
    id: record.id,
    source: 'signature_request',
    applicationId: record.applicationId,
    documentationItemId: record.documentationItemId,
    documentType: record.documentType,
    documentLabel: getSignatureDocumentType(record.documentType)?.label || record.documentType,
    envelopeId: record.envelopeId,
    status: record.status,
    statusLabel: SIGNATURE_STATUS_LABELS[record.status] || record.status,
    signerEmail: record.signerEmail,
    signerName: record.signerName,
    errorMessage: record.errorMessage || '',
    completedAt: record.completedAt?.toISOString() || null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    jobTitle: record.application?.job?.title || '',
    candidateUserId: record.application?.candidate?.user?.id || null,
    canSign: PENDING_SIGNATURE_STATUSES.includes(record.status),
    isCompleted: record.status === 'COMPLETED',
    portalRoute: null,
  }
}

function mapCandidateDocumentSignature(record) {
  const typeConfig = getDocumentTypeConfig(record.documentType)
  const isSigned = record.status === 'SIGNED'
  const canSign = !isSigned && (SIGNABLE_STATUSES.includes(record.status) || record.status === 'ERROR')

  return {
    id: record.id,
    source: 'candidate_document',
    applicationId: record.applicationId,
    documentationItemId: null,
    documentType: typeConfig?.slug || record.documentType,
    documentLabel: typeConfig?.label || record.documentType,
    envelopeId: record.providerEnvelopeId || '',
    status: isSigned ? 'COMPLETED' : record.status,
    statusLabel: isSigned ? 'Assinado' : DOCUMENT_STATUS_LABELS[record.status] || record.status,
    signerEmail: record.candidate?.user?.email || '',
    signerName: record.candidate?.name || '',
    errorMessage: '',
    completedAt: record.signedAt?.toISOString() || null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    jobTitle: record.application?.job?.title || '',
    candidateUserId: record.candidate?.user?.id || null,
    canSign,
    isCompleted: isSigned,
    portalRoute: typeConfig?.portalRoute || null,
  }
}

function mapPendingEthnicDeclaration(application) {
  return {
    id: `pending-ethnic-${application.id}`,
    source: 'candidate_document_pending',
    applicationId: application.id,
    documentationItemId: null,
    documentType: 'autodeclaracao',
    documentLabel: 'Autodeclaração Étnico-Racial',
    envelopeId: '',
    status: 'PENDING',
    statusLabel: 'Aguardando assinatura',
    signerEmail: '',
    signerName: '',
    errorMessage: '',
    completedAt: null,
    createdAt: application.documentation.createdAt.toISOString(),
    updatedAt: application.documentation.updatedAt.toISOString(),
    jobTitle: application.job?.title || '',
    candidateUserId: null,
    canSign: true,
    isCompleted: false,
    portalRoute: '/portal-do-candidato/autodeclaracao-etnica',
  }
}

async function listEthnicDeclarationSignatures(profileId) {
  const ethnicDocuments = await prisma.candidateDocument.findMany({
    where: {
      candidateId: profileId,
      documentType: 'ETHNIC_DECLARATION',
      ...notDeleted(),
      application: {
        currentStage: DOCUMENTATION_STAGE,
        ...notDeleted(),
      },
    },
    include: {
      candidate: { include: { user: { select: { id: true, email: true } } } },
      application: { include: { job: { select: { title: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const applications = await prisma.application.findMany({
    where: {
      candidateId: profileId,
      currentStage: DOCUMENTATION_STAGE,
      ...notDeleted(),
      documentation: {
        candidateNotifiedAt: { not: null },
        ...notDeleted(),
      },
    },
    include: {
      job: { select: { title: true } },
      documentation: { include: { items: { where: notDeleted() } } },
    },
  })

  const mappedDocuments = ethnicDocuments.map(mapCandidateDocumentSignature)
  const coveredApplicationIds = new Set(
    ethnicDocuments.map((record) => record.applicationId).filter(Boolean),
  )

  const pendingPlaceholders = applications
    .filter((application) => {
      if (coveredApplicationIds.has(application.id)) return false
      const ethnicItem = application.documentation?.items.find((item) => item.slug === 'autodeclaracao')
      return ethnicItem && ['PENDING', 'REJECTED'].includes(ethnicItem.status)
    })
    .map(mapPendingEthnicDeclaration)

  return [...mappedDocuments, ...pendingPlaceholders]
}

function resolveDocumentationItem(application, documentTypeConfig) {
  const documentation = application.documentation
  if (!documentation) return null
  return documentation.items.find(
    (item) => item.slug === documentTypeConfig.documentationItemSlug,
  ) || null
}

async function loadDocumentBase64(documentTypeConfig) {
  if (documentTypeConfig.templateId) return null

  if (fs.existsSync(documentTypeConfig.localPdfPath)) {
    return fs.readFileSync(documentTypeConfig.localPdfPath).toString('base64')
  }

  throw new Error('DOCUSIGN_DOCUMENT_MISSING')
}

export async function listCandidateSignatureRequests(userId) {
  const profile = await prisma.candidateProfile.findFirst({
    where: { userId, ...notDeleted() },
    select: { id: true },
  })
  if (!profile) return []

  const records = await prisma.documentSignatureRequest.findMany({
    where: {
      ...notDeleted(),
      application: {
        candidateId: profile.id,
        currentStage: DOCUMENTATION_STAGE,
        ...notDeleted(),
      },
    },
    include: signatureInclude,
    orderBy: { createdAt: 'desc' },
  })

  const signatureRequests = records.map(mapSignatureRequest)
  const ethnicDeclarations = await listEthnicDeclarationSignatures(profile.id)

  const ethnicApplicationIds = new Set(
    ethnicDeclarations.map((item) => item.applicationId).filter(Boolean),
  )

  const merged = [
    ...signatureRequests.filter(
      (item) => !(item.documentType === 'autodeclaracao' && ethnicApplicationIds.has(item.applicationId)),
    ),
    ...ethnicDeclarations,
  ]

  return merged.sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
}

export async function getCandidateSignatureRequest(userId, requestId) {
  const profile = await prisma.candidateProfile.findFirst({
    where: { userId, ...notDeleted() },
    select: { id: true },
  })
  if (!profile) throw new Error('NOT_FOUND')

  const record = await prisma.documentSignatureRequest.findFirst({
    where: {
      id: requestId,
      ...notDeleted(),
      application: { candidateId: profile.id, ...notDeleted() },
    },
    include: signatureInclude,
  })
  if (!record) throw new Error('NOT_FOUND')
  return mapSignatureRequest(record)
}

export async function createSignatureRequestForApplication(
  applicationId,
  documentType,
  actorId,
  auditContext = {},
) {
  assertDocuSignConfigured()

  const documentTypeConfig = getSignatureDocumentType(documentType)
  if (!documentTypeConfig) throw new Error('INVALID_DOCUMENT_TYPE')

  const application = await prisma.application.findFirst({
    where: { id: applicationId, ...notDeleted() },
    include: {
      candidate: { include: { user: { select: { id: true, email: true } } } },
      job: { select: { title: true } },
      documentation: { include: { items: { where: notDeleted() } } },
    },
  })

  if (!application) throw new Error('APPLICATION_NOT_FOUND')
  if (application.currentStage !== DOCUMENTATION_STAGE) {
    throw new Error('INVALID_STAGE')
  }
  if (!application.documentation) throw new Error('DOCUMENTATION_NOT_FOUND')

  const documentationItem = resolveDocumentationItem(application, documentTypeConfig)

  const existing = await prisma.documentSignatureRequest.findFirst({
    where: {
      applicationId,
      documentType,
      status: { in: ['CREATED', 'SENT', 'DELIVERED', 'SIGNED', 'COMPLETED'] },
      ...notDeleted(),
    },
  })

  if (existing?.status === 'COMPLETED') {
    throw new Error('ALREADY_SIGNED')
  }

  if (existing && PENDING_SIGNATURE_STATUSES.includes(existing.status)) {
    return mapSignatureRequest(
      await prisma.documentSignatureRequest.findFirst({
        where: { id: existing.id },
        include: signatureInclude,
      }),
    )
  }

  const signerEmail = application.candidate.user.email
  const signerName = application.candidate.name
  const clientUserId = application.candidate.user.id
  const documentBase64 = await loadDocumentBase64(documentTypeConfig)

  const envelopeId = await createEmbeddedSigningEnvelope({
    email: signerEmail,
    name: signerName,
    clientUserId,
    documentName: documentTypeConfig.label,
    documentBase64,
    templateId: documentTypeConfig.templateId,
    templateRole: documentTypeConfig.templateRole,
    emailSubject: documentTypeConfig.emailSubject,
  })

  const record = await prisma.documentSignatureRequest.create({
    data: {
      applicationId,
      documentationItemId: documentationItem?.id || null,
      documentType,
      envelopeId,
      status: 'SENT',
      signerEmail,
      signerName,
      clientUserId,
      createdById: actorId,
    },
    include: signatureInclude,
  })

  await createAuditLog({
    actorId,
    action: 'signature.request_created',
    entityType: 'DocumentSignatureRequest',
    entityId: record.id,
    metadata: {
      applicationId,
      documentType,
      envelopeId,
      candidateName: signerName,
      jobTitle: application.job.title,
    },
    ipAddress: auditContext.ipAddress,
  })

  return mapSignatureRequest(record)
}

export async function getCandidateSigningUrl(userId, requestId, returnUrl) {
  const record = await prisma.documentSignatureRequest.findFirst({
    where: {
      id: requestId,
      ...notDeleted(),
      application: {
        candidate: { userId, ...notDeleted() },
        ...notDeleted(),
      },
    },
  })

  if (!record) throw new Error('NOT_FOUND')
  if (record.status === 'COMPLETED') throw new Error('ALREADY_SIGNED')
  if (!record.envelopeId) throw new Error('ENVELOPE_NOT_FOUND')

  const signingUrl = await createRecipientSigningUrl({
    envelopeId: record.envelopeId,
    email: record.signerEmail,
    name: record.signerName,
    clientUserId: record.clientUserId,
    returnUrl: returnUrl || `${env.appUrl}/portal-do-candidato/assinaturas?completed=${record.id}`,
  })

  if (record.status === 'CREATED') {
    await prisma.documentSignatureRequest.update({
      where: { id: record.id },
      data: { status: 'SENT' },
    })
  }

  return { signingUrl, requestId: record.id }
}

export async function refreshSignatureRequestStatus(requestId, actorId = null, auditContext = {}) {
  const record = await prisma.documentSignatureRequest.findFirst({
    where: { id: requestId, ...notDeleted() },
    include: signatureInclude,
  })
  if (!record?.envelopeId) throw new Error('NOT_FOUND')

  const envelopeStatus = await getEnvelopeStatus(record.envelopeId)
  const internalStatus = mapDocuSignStatusToInternal(envelopeStatus)

  if (internalStatus === 'COMPLETED' && record.status !== 'COMPLETED') {
    return finalizeCompletedSignature(record, actorId, auditContext)
  }

  if (internalStatus !== record.status) {
    const updated = await prisma.documentSignatureRequest.update({
      where: { id: record.id },
      data: { status: internalStatus },
      include: signatureInclude,
    })
    return mapSignatureRequest(updated)
  }

  return mapSignatureRequest(record)
}

async function finalizeCompletedSignature(record, actorId, auditContext = {}) {
  const pdfBuffer = await downloadCompletedDocument(record.envelopeId)
  const candidateProfileId = record.application.candidateId
  const fileName = `${record.documentType}-assinado.pdf`
  const key = `signatures/${record.id}/${Date.now()}.pdf`

  const stored = await storageService.upload(
    {
      buffer: pdfBuffer,
      mimetype: 'application/pdf',
      originalname: fileName,
      size: pdfBuffer.length,
    },
    { key, directory: 'signatures' },
  )

  if (record.documentationItem?.documentId) {
    const previous = await prisma.document.findFirst({
      where: { id: record.documentationItem.documentId },
    })
    if (previous) {
      await storageService.delete(previous.storageKey).catch(() => {})
      await prisma.document.update({
        where: { id: previous.id },
        data: softDeleteData(),
      })
    }
  }

  const document = await prisma.document.create({
    data: {
      ownerType: 'APPLICATION_DOCUMENTATION',
      ownerId: record.documentationItemId || record.id,
      candidateId: candidateProfileId,
      type: 'docusign_signed',
      storageKey: stored.key,
      provider: stored.provider,
      originalName: fileName,
      mimeType: 'application/pdf',
      size: pdfBuffer.length,
    },
  })

  if (record.documentationItemId) {
    await prisma.applicationDocumentationItem.update({
      where: { id: record.documentationItemId },
      data: {
        documentId: document.id,
        status: 'UPLOADED',
        rejectionReason: '',
        reviewedById: null,
        reviewedAt: null,
      },
    })

    const { refreshDocumentationStatus } = await import('./applicationDocumentation.service.js')
    if (record.application.documentation?.id) {
      await refreshDocumentationStatus(record.application.documentation.id)
    }
  }

  const updated = await prisma.documentSignatureRequest.update({
    where: { id: record.id },
    data: {
      status: 'COMPLETED',
      signedDocumentId: document.id,
      completedAt: new Date(),
      errorMessage: '',
    },
    include: signatureInclude,
  })

  await createAuditLog({
    actorId,
    action: 'signature.completed',
    entityType: 'DocumentSignatureRequest',
    entityId: record.id,
    metadata: {
      applicationId: record.applicationId,
      envelopeId: record.envelopeId,
      documentType: record.documentType,
    },
    ipAddress: auditContext.ipAddress,
  })

  return mapSignatureRequest(updated)
}

export async function handleDocuSignWebhook(payload) {
  const envelopeId =
    payload?.data?.envelopeId ||
    payload?.envelopeId ||
    payload?.data?.envelopeSummary?.envelopeId

  if (!envelopeId) return { handled: false }

  const record = await prisma.documentSignatureRequest.findFirst({
    where: { envelopeId, ...notDeleted() },
    include: signatureInclude,
  })

  if (!record) return { handled: false, envelopeId }

  const event = String(payload?.event || '').toLowerCase()
  if (event.includes('completed') || event.includes('signed')) {
    await finalizeCompletedSignature(record, null, {})
    return { handled: true, requestId: record.id, status: 'COMPLETED' }
  }

  if (event.includes('declined')) {
    await prisma.documentSignatureRequest.update({
      where: { id: record.id },
      data: { status: 'DECLINED' },
    })
    return { handled: true, requestId: record.id, status: 'DECLINED' }
  }

  if (event.includes('voided')) {
    await prisma.documentSignatureRequest.update({
      where: { id: record.id },
      data: { status: 'VOIDED' },
    })
    return { handled: true, requestId: record.id, status: 'VOIDED' }
  }

  return { handled: true, requestId: record.id, status: record.status }
}

export async function listAdminSignatureRequests(filters = {}) {
  const where = { ...notDeleted() }

  if (filters.applicationId) where.applicationId = filters.applicationId
  if (filters.status) where.status = filters.status

  const records = await prisma.documentSignatureRequest.findMany({
    where,
    include: signatureInclude,
    orderBy: { createdAt: 'desc' },
    take: filters.limit ? Number(filters.limit) : 50,
  })

  return records.map(mapSignatureRequest)
}

export { isDocuSignConfigured } from './docusign.client.js'
