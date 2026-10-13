import { prisma, notDeleted } from '../lib/prisma.js'
import { formatCpf } from '../utils/candidateProfile.js'
import {
  CANDIDATE_DOCUMENT_REGISTRY,
  RACE_CATEGORY_OPTIONS,
  isValidRaceCategory,
  formatCurrentDatePtBr,
} from '../constants/candidateDocuments.js'
import { DOCUMENT_STATUS_LABELS } from '../modules/documents/documentRegistry.js'
import { documentService } from '../modules/documents/DocumentService.js'
import { streamCandidateDocumentFile } from '../modules/documents/documentStorage.js'
import { isDocuSignConfigured } from '../modules/signatures/providers/docusign/DocuSignProvider.js'
import { generateEthnicDeclarationTemplateBuffer } from './candidateDocumentPdf.service.js'
import { createAuditLog } from './audit.service.js'
import { DOCUMENTATION_STAGE } from '../utils/pipelineStages.js'

const ETHNIC = CANDIDATE_DOCUMENT_REGISTRY.ETHNIC_DECLARATION

async function resolveCandidate(userId) {
  const user = await prisma.user.findFirst({
    where: { id: userId, type: 'CANDIDATE', ...notDeleted() },
    include: { candidateProfile: true },
  })
  if (!user?.candidateProfile) throw new Error('NOT_FOUND')
  return user.candidateProfile
}

async function findActiveApplicationId(candidateId) {
  const application = await prisma.application.findFirst({
    where: {
      candidateId,
      ...notDeleted(),
      currentStage: DOCUMENTATION_STAGE,
    },
    orderBy: { updatedAt: 'desc' },
  })
  return application?.id || null
}

function mapCandidateDocument(record) {
  return {
    id: record.id,
    status: record.status,
    statusLabel: DOCUMENT_STATUS_LABELS[record.status] || record.status,
    signedAt: record.signedAt?.toISOString() || null,
    provider: record.provider || '',
    providerEnvelopeId: record.providerEnvelopeId || '',
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

export async function getEthnicDeclarationState(userId) {
  const profile = await resolveCandidate(userId)

  const existing = await prisma.candidateDocument.findFirst({
    where: {
      candidateId: profile.id,
      documentType: 'ETHNIC_DECLARATION',
      ...notDeleted(),
    },
    orderBy: { createdAt: 'desc' },
  })

  const applicationId = existing?.applicationId || (await findActiveApplicationId(profile.id))
  const isSigned = existing?.status === 'SIGNED'
  const canSign = !isSigned && existing?.status !== 'DECLINED'

  return {
    documentType: ETHNIC.type,
    label: ETHNIC.label,
    description: ETHNIC.description,
    routePath: ETHNIC.routePath,
    candidate: {
      name: profile.name,
      cpf: formatCpf(profile.cpf),
      city: profile.city || '—',
      currentDate: formatCurrentDatePtBr(),
    },
    raceCategory: profile.raceCategory || existing?.raceCategory || null,
    raceDescription: profile.raceDescription || existing?.raceDescription || '',
    raceOptions: RACE_CATEGORY_OPTIONS,
    document: existing ? mapCandidateDocument(existing) : null,
    canSign,
    applicationId,
    signatureIntegration: {
      provider: 'docusign',
      configured: isDocuSignConfigured(),
    },
  }
}

export { generateEthnicDeclarationTemplateBuffer } from './candidateDocumentPdf.service.js'

export async function streamEthnicDeclarationPdf(userId) {
  const profile = await resolveCandidate(userId)

  const record = await prisma.candidateDocument.findFirst({
    where: {
      candidateId: profile.id,
      documentType: 'ETHNIC_DECLARATION',
      status: 'SIGNED',
      ...notDeleted(),
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!record?.signedPdfPath) throw new Error('DOCUMENT_NOT_FOUND')

  const downloaded = await streamCandidateDocumentFile(record.signedPdfPath)
  return {
    stream: downloaded.stream,
    mimeType: 'application/pdf',
    fileName: 'autodeclaracao-etnica.pdf',
  }
}

export async function signEthnicDeclaration(userId, payload, auditContext = {}) {
  const {
    raceCategory,
    raceDescription = '',
    declarationAccepted,
    applicationId: requestedApplicationId,
    returnUrl,
  } = payload

  if (!declarationAccepted) throw new Error('DECLARATION_REQUIRED')
  if (!isValidRaceCategory(raceCategory)) throw new Error('INVALID_RACE_CATEGORY')

  const profile = await resolveCandidate(userId)
  const applicationId = requestedApplicationId || (await findActiveApplicationId(profile.id))
  const trimmedDescription = String(raceDescription || '').trim().slice(0, 2000)

  await prisma.candidateProfile.update({
    where: { id: profile.id },
    data: {
      raceCategory,
      raceDescription: trimmedDescription,
    },
  })

  const document = await documentService.createOrUpdateDocument({
    candidateId: profile.id,
    applicationId,
    documentType: 'ETHNIC_DECLARATION',
    provider: 'docusign',
    raceCategory,
    raceDescription: trimmedDescription,
  })

  const signResult = await documentService.initiateSign(document.id, userId, { returnUrl })

  await createAuditLog({
    actorId: userId,
    action: 'candidate_document.sign_initiated',
    entityType: 'candidate_document',
    entityId: document.id,
    ipAddress: auditContext.ipAddress,
    metadata: {
      documentType: ETHNIC.type,
      raceCategory,
      provider: 'docusign',
      envelopeId: signResult.envelopeId,
    },
  })

  const state = await getEthnicDeclarationState(userId)

  return {
    state,
    success: true,
    signingUrl: signResult.signingUrl,
    documentId: document.id,
  }
}

export function getRegistryEntry(slug) {
  return Object.values(CANDIDATE_DOCUMENT_REGISTRY).find((entry) => entry.slug === slug) || null
}

export async function streamDocumentTemplate(slug) {
  const entry = getRegistryEntry(slug)
  if (!entry) throw new Error('NOT_FOUND')

  if (entry.type === 'ETHNIC_DECLARATION') {
    const buffer = await generateEthnicDeclarationTemplateBuffer()
    return { buffer, mimeType: 'application/pdf', fileName: `${slug}-modelo.pdf` }
  }

  throw new Error('NOT_FOUND')
}
