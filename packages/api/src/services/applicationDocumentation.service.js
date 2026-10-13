import { prisma, notDeleted, softDeleteData } from '../lib/prisma.js'
import { storageService } from '../storage/index.js'
import { createAuditLog } from './audit.service.js'
import { getResumeExtension, getDocumentationExtension } from './resume.service.js'
import { DEFAULT_DOCUMENT_CHECKLIST_ITEMS, getChecklistItemMeta, isEthnicDeclarationChecklistItem, resolveChecklistCanonicalSlug, resolveChecklistItemDefaults } from '../constants/documentChecklist.js'
import { DOCUMENTATION_STAGE } from '../utils/pipelineStages.js'
import {
  DOCUMENTATION_CANDIDATE_GUIDANCE,
  DOCUMENTATION_REJECTION_PORTAL_HINT,
} from '../constants/documentationGuidance.js'

const documentationInclude = {
  application: {
    include: {
      candidate: {
        include: { user: { select: { id: true, email: true } } },
      },
      job: { select: { id: true, title: true, slug: true } },
    },
  },
  items: {
    where: notDeleted(),
    orderBy: { sortOrder: 'asc' },
    include: {
      document: true,
      reviewedBy: { include: { staffProfile: true } },
    },
  },
}

function mapDocumentationItem(item) {
  const defaults = resolveChecklistItemDefaults(item.slug, item.label)
  const slug = defaults?.slug || resolveChecklistCanonicalSlug(item.slug, item.label) || item.slug
  const meta = getChecklistItemMeta(slug, item.label)
  const electronicSignature = isEthnicDeclarationChecklistItem(slug, item.label)

  return {
    id: item.id,
    slug,
    label: defaults?.label || item.label,
    description: electronicSignature
      ? defaults?.description || 'Preencha e assine eletronicamente pelo portal — os dados são gerados automaticamente.'
      : (defaults?.description || item.description),
    helpUrl: meta.helpUrl,
    required: item.required,
    sortOrder: item.sortOrder,
    status: item.status,
    rejectionReason: item.rejectionReason || '',
    documentId: item.documentId,
    documentFileName: item.document?.originalName || null,
    documentMimeType: item.document?.mimeType || null,
    documentSize: item.document?.size || 0,
    reviewedByName: item.reviewedBy?.staffProfile?.name || null,
    reviewedAt: item.reviewedAt?.toISOString() || null,
    electronicSignature,
    signatureRoute: electronicSignature ? '/portal-do-candidato/autodeclaracao-etnica' : null,
  }
}

function mapDocumentation(record) {
  const items = record.items || []
  const requiredItems = items.filter((item) => item.required)
  const uploadedRequired = requiredItems.filter((item) =>
    ['UPLOADED', 'APPROVED'].includes(item.status),
  ).length
  const approvedRequired = requiredItems.filter((item) => item.status === 'APPROVED').length

  const app = record.application

  return {
    id: record.id,
    applicationId: record.applicationId,
    status: record.status,
    candidateUserId: app?.candidate?.user?.id || null,
    candidateName: app?.candidate?.name || '',
    jobTitle: app?.job?.title || '',
    rejectionReason: record.rejectionReason || '',
    rejectedAt: record.rejectedAt?.toISOString() || null,
    candidateNotifiedAt: record.candidateNotifiedAt?.toISOString() || null,
    submittedForReviewAt: record.submittedForReviewAt?.toISOString() || null,
    guidance: DOCUMENTATION_CANDIDATE_GUIDANCE,
    rejectionHint: DOCUMENTATION_REJECTION_PORTAL_HINT,
    hasRejectedItems: items.some((item) => item.status === 'REJECTED'),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    progress: {
      totalRequired: requiredItems.length,
      uploadedRequired,
      approvedRequired,
      allRequiredUploaded: requiredItems.length > 0 && uploadedRequired === requiredItems.length,
      allRequiredApproved: requiredItems.length > 0 && approvedRequired === requiredItems.length,
    },
    items: items.map(mapDocumentationItem),
  }
}

async function getDefaultTemplate() {
  return prisma.documentChecklistTemplate.findFirst({
    where: { isDefault: true, isActive: true, ...notDeleted() },
    include: {
      items: { where: notDeleted(), orderBy: { sortOrder: 'asc' } },
    },
  })
}

export async function refreshDocumentationStatus(documentationId) {
  const record = await prisma.applicationDocumentation.findFirst({
    where: { id: documentationId, ...notDeleted() },
    include: { items: { where: notDeleted() } },
  })
  if (!record || ['APPROVED', 'REJECTED'].includes(record.status)) {
    return { transitionedToReview: false }
  }

  const requiredItems = record.items.filter((item) => item.required)
  const allUploaded = requiredItems.every((item) =>
    ['UPLOADED', 'APPROVED', 'REJECTED'].includes(item.status),
  )

  if (record.status === 'PENDING_UPLOAD' && allUploaded && requiredItems.length > 0) {
    await prisma.applicationDocumentation.update({
      where: { id: documentationId },
      data: {
        status: 'UNDER_REVIEW',
        submittedForReviewAt: new Date(),
      },
    })
    return { transitionedToReview: true }
  }

  return { transitionedToReview: false }
}

export async function createApplicationDocumentation(applicationId, actorId, auditContext = {}) {
  const existing = await prisma.applicationDocumentation.findFirst({
    where: { applicationId, ...notDeleted() },
    include: documentationInclude,
  })
  if (existing) return mapDocumentation(existing)

  const application = await prisma.application.findFirst({
    where: { id: applicationId, ...notDeleted() },
    include: {
      job: { select: { title: true } },
      candidate: { select: { name: true } },
    },
  })
  if (!application) throw new Error('APPLICATION_NOT_FOUND')

  const template = await getDefaultTemplate()
  const templateItems = template?.items?.length
    ? template.items
    : DEFAULT_DOCUMENT_CHECKLIST_ITEMS.map((item) => ({ ...item, id: null, required: true }))

  const record = await prisma.applicationDocumentation.create({
    data: {
      applicationId,
      templateId: template?.id || null,
      status: 'PENDING_UPLOAD',
      items: {
        create: templateItems.map((item) => ({
          templateItemId: item.id || null,
          slug:
            item.slug ||
            DEFAULT_DOCUMENT_CHECKLIST_ITEMS.find((entry) => entry.label === item.label)?.slug ||
            '',
          label: item.label,
          description: item.description || '',
          required: item.required !== false,
          sortOrder: item.sortOrder,
        })),
      },
    },
    include: documentationInclude,
  })

  await createAuditLog({
    actorId,
    action: 'application.documentation_open',
    entityType: 'ApplicationDocumentation',
    entityId: record.id,
    metadata: {
      applicationId,
      jobTitle: application.job.title,
      candidateName: application.candidate.name,
    },
    ipAddress: auditContext.ipAddress,
  })

  return mapDocumentation(record)
}

export async function ensureApplicationDocumentation(applicationId, actorId, auditContext = {}) {
  const existing = await prisma.applicationDocumentation.findFirst({
    where: { applicationId, ...notDeleted() },
    include: documentationInclude,
  })
  if (existing) {
    await reconcileDocumentationChecklist(existing.id)
    const refreshed = await prisma.applicationDocumentation.findFirst({
      where: { id: existing.id, ...notDeleted() },
      include: documentationInclude,
    })
    return mapDocumentation(refreshed)
  }
  return createApplicationDocumentation(applicationId, actorId, auditContext)
}

/** Alinha itens existentes com o checklist padrão atual (remove obsoletos, adiciona novos) */
export async function reconcileDocumentationChecklist(documentationId) {
  const record = await prisma.applicationDocumentation.findFirst({
    where: { id: documentationId, ...notDeleted() },
    include: { items: { where: notDeleted() } },
  })
  if (!record) return 0

  const template = await getDefaultTemplate()
  const source = template?.items?.length ? template.items : DEFAULT_DOCUMENT_CHECKLIST_ITEMS
  const expected = source.map((item) => {
    const defaults = resolveChecklistItemDefaults(item.slug, item.label)
    return {
      slug: defaults?.slug || resolveChecklistCanonicalSlug(item.slug, item.label) || item.slug || '',
      label: defaults?.label || item.label,
      description: defaults?.description || item.description || '',
      required: item.required !== false,
      sortOrder: defaults?.sortOrder ?? item.sortOrder,
      templateItemId: item.id || null,
    }
  })

  const expectedSlugs = new Set(expected.map((item) => item.slug).filter(Boolean))
  let changed = 0
  const seenCanonical = new Set()

  for (const item of record.items) {
    const canonical = resolveChecklistCanonicalSlug(item.slug, item.label)
    const matchesExpected = (canonical && expectedSlugs.has(canonical))
      || expected.some((entry) => entry.label === item.label)

    if (!matchesExpected) {
      await prisma.applicationDocumentationItem.update({
        where: { id: item.id },
        data: softDeleteData(),
      })
      changed += 1
      continue
    }

    if (canonical && seenCanonical.has(canonical)) {
      await prisma.applicationDocumentationItem.update({
        where: { id: item.id },
        data: softDeleteData(),
      })
      changed += 1
      continue
    }
    if (canonical) seenCanonical.add(canonical)

    const expectedItem =
      expected.find((entry) => canonical && entry.slug === canonical) ||
      expected.find((entry) => entry.label === item.label)

    if (!expectedItem) continue

    const needsUpdate =
      item.slug !== expectedItem.slug ||
      item.label !== expectedItem.label ||
      item.description !== expectedItem.description ||
      item.required !== expectedItem.required ||
      item.sortOrder !== expectedItem.sortOrder ||
      item.templateItemId !== expectedItem.templateItemId

    if (needsUpdate) {
      await prisma.applicationDocumentationItem.update({
        where: { id: item.id },
        data: {
          slug: expectedItem.slug,
          label: expectedItem.label,
          description: expectedItem.description,
          required: expectedItem.required,
          sortOrder: expectedItem.sortOrder,
          templateItemId: expectedItem.templateItemId,
        },
      })
      changed += 1
    }
  }

  const currentSlugs = new Set(
    record.items
      .filter((item) => {
        const canonical = resolveChecklistCanonicalSlug(item.slug, item.label)
        return (canonical && expectedSlugs.has(canonical))
          || expected.some((entry) => entry.label === item.label)
      })
      .map((item) => resolveChecklistCanonicalSlug(item.slug, item.label) || item.slug || item.label),
  )

  for (const item of expected) {
    const key = item.slug || item.label
    if (currentSlugs.has(key)) continue
    await prisma.applicationDocumentationItem.create({
      data: {
        documentationId,
        templateItemId: item.templateItemId,
        slug: item.slug,
        label: item.label,
        description: item.description,
        required: item.required,
        sortOrder: item.sortOrder,
      },
    })
    changed += 1
  }

  return changed
}

export async function syncMissingApplicationDocumentations() {
  const applications = await prisma.application.findMany({
    where: {
      currentStage: DOCUMENTATION_STAGE,
      status: { notIn: ['REJECTED', 'WITHDRAWN'] },
      ...notDeleted(),
      documentation: null,
    },
    select: { id: true },
  })

  for (const app of applications) {
    await createApplicationDocumentation(app.id, null, {})
  }

  const withDocs = await prisma.applicationDocumentation.findMany({
    where: { ...notDeleted() },
    select: { id: true },
  })

  for (const doc of withDocs) {
    await reconcileDocumentationChecklist(doc.id)
  }

  return applications.length
}

export async function listCandidateDocumentations(userId) {
  const profile = await prisma.candidateProfile.findFirst({
    where: { userId, ...notDeleted() },
    select: { id: true },
  })
  if (!profile) return []

  const records = await prisma.applicationDocumentation.findMany({
    where: {
      ...notDeleted(),
      candidateNotifiedAt: { not: null },
      status: { in: ['PENDING_UPLOAD', 'UNDER_REVIEW'] },
      application: {
        candidateId: profile.id,
        currentStage: DOCUMENTATION_STAGE,
        ...notDeleted(),
      },
    },
    include: documentationInclude,
    orderBy: { updatedAt: 'desc' },
  })

  for (const record of records) {
    await reconcileDocumentationChecklist(record.id)
  }

  if (records.length) {
    const refreshed = await prisma.applicationDocumentation.findMany({
      where: { id: { in: records.map((r) => r.id) }, ...notDeleted() },
      include: documentationInclude,
      orderBy: { updatedAt: 'desc' },
    })
    return refreshed.map(mapDocumentation)
  }

  return records.map(mapDocumentation)
}

export async function getCandidateDocumentation(userId, documentationId) {
  const profile = await prisma.candidateProfile.findFirst({
    where: { userId, ...notDeleted() },
    select: { id: true },
  })
  if (!profile) throw new Error('NOT_FOUND')

  const record = await prisma.applicationDocumentation.findFirst({
    where: {
      id: documentationId,
      ...notDeleted(),
      application: { candidateId: profile.id, ...notDeleted() },
    },
    include: documentationInclude,
  })
  if (!record) throw new Error('NOT_FOUND')

  return mapDocumentation(record)
}

export async function getDocumentationByApplicationId(applicationId) {
  const record = await prisma.applicationDocumentation.findFirst({
    where: { applicationId, ...notDeleted() },
    include: documentationInclude,
  })
  return record ? mapDocumentation(record) : null
}

export async function uploadDocumentationItem(
  documentationId,
  itemId,
  file,
  actorId,
  auditContext = {},
  { isCandidate = false } = {},
) {
  const record = await prisma.applicationDocumentation.findFirst({
    where: { id: documentationId, ...notDeleted() },
    include: documentationInclude,
  })
  if (!record) throw new Error('NOT_FOUND')
  if (['APPROVED', 'REJECTED'].includes(record.status)) throw new Error('INVALID_STATUS')

  if (!isCandidate && record.application.currentStage === DOCUMENTATION_STAGE) {
    throw new Error('CANDIDATE_UPLOAD_ONLY')
  }

  const item = record.items.find((entry) => entry.id === itemId)
  if (!item) throw new Error('ITEM_NOT_FOUND')

  const wasRejected = item.status === 'REJECTED'
  const candidateProfileId = record.application.candidateId
  const ext = getDocumentationExtension(file.mimetype, file.originalname)
  const key = `documentation/${documentationId}/${itemId}-${Date.now()}${ext}`

  if (item.documentId) {
    const previous = await prisma.document.findFirst({ where: { id: item.documentId } })
    if (previous) {
      await storageService.delete(previous.storageKey).catch(() => {})
      await prisma.document.update({ where: { id: previous.id }, data: softDeleteData() })
    }
  }

  const stored = await storageService.upload(file, { key, directory: 'documentation' })

  const document = await prisma.document.create({
    data: {
      ownerType: 'APPLICATION_DOCUMENTATION',
      ownerId: itemId,
      candidateId: candidateProfileId,
      type: 'application_documentation',
      storageKey: stored.key,
      provider: stored.provider,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    },
  })

  await prisma.applicationDocumentationItem.update({
    where: { id: itemId },
    data: {
      documentId: document.id,
      status: 'UPLOADED',
      rejectionReason: '',
      reviewedById: null,
      reviewedAt: null,
    },
  })

  await refreshDocumentationStatus(documentationId)

  if (isCandidate) {
    const { notifyHrDocumentationSubmitted } = await import('./documentationNotifications.service.js')
    const refreshedRecord = await prisma.applicationDocumentation.findFirst({
      where: { id: documentationId, ...notDeleted() },
    })

    if (wasRejected && refreshedRecord?.status === 'UNDER_REVIEW') {
      await notifyHrDocumentationSubmitted({
        documentationId,
        actorId,
        auditContext,
        resubmitted: true,
      })
    } else if (refreshedRecord?.status === 'UNDER_REVIEW' && refreshedRecord.submittedForReviewAt) {
      const justSubmitted =
        Date.now() - new Date(refreshedRecord.submittedForReviewAt).getTime() < 5000
      if (justSubmitted) {
        await notifyHrDocumentationSubmitted({
          documentationId,
          actorId,
          auditContext,
          resubmitted: false,
        })
      }
    }
  }

  await createAuditLog({
    actorId,
    action: isCandidate ? 'application.documentation_upload' : 'application.documentation_staff_upload',
    entityType: 'ApplicationDocumentationItem',
    entityId: itemId,
    metadata: { documentationId, label: item.label, fileName: file.originalname },
    ipAddress: auditContext.ipAddress,
  })

  return getDocumentationByApplicationId(record.applicationId)
}

export async function reviewDocumentationItem(
  documentationId,
  itemId,
  decision,
  reason,
  actorId,
  auditContext = {},
) {
  const record = await prisma.applicationDocumentation.findFirst({
    where: { id: documentationId, ...notDeleted() },
    include: documentationInclude,
  })
  if (!record) throw new Error('NOT_FOUND')
  if (!['PENDING_UPLOAD', 'UNDER_REVIEW'].includes(record.status)) {
    throw new Error('INVALID_STATUS')
  }

  const item = record.items.find((entry) => entry.id === itemId)
  if (!item) throw new Error('ITEM_NOT_FOUND')
  if (decision === 'approved' && item.status !== 'UPLOADED') {
    throw new Error('ITEM_NOT_UPLOADED')
  }

  if (decision === 'rejected') {
    const trimmedReason = String(reason || '').trim()
    if (!trimmedReason) throw new Error('VALIDATION')
  }

  const previousStatus = item.status

  await prisma.applicationDocumentationItem.update({
    where: { id: itemId },
    data: {
      status: decision === 'approved' ? 'APPROVED' : 'REJECTED',
      rejectionReason: decision === 'rejected' ? String(reason || '').trim() : '',
      reviewedById: actorId,
      reviewedAt: new Date(),
    },
  })

  await createAuditLog({
    actorId,
    action: decision === 'approved'
      ? 'application.documentation_item_approve'
      : 'application.documentation_item_reject',
    entityType: 'ApplicationDocumentationItem',
    entityId: itemId,
    metadata: {
      documentationId,
      label: item.label,
      reason: decision === 'rejected' ? String(reason || '').trim() : undefined,
    },
    ipAddress: auditContext.ipAddress,
  })

  if (decision === 'rejected' && previousStatus === 'UPLOADED') {
    const { notifyCandidateDocumentItemRejected } = await import('./documentationNotifications.service.js')
    await notifyCandidateDocumentItemRejected({
      documentationId,
      itemLabel: item.label,
      reason: String(reason || '').trim(),
      actorId,
      auditContext,
    })
  }

  return getDocumentationByApplicationId(record.applicationId)
}

export async function streamDocumentationItemDocument(documentationId, itemId) {
  const record = await prisma.applicationDocumentation.findFirst({
    where: { id: documentationId, ...notDeleted() },
    include: documentationInclude,
  })
  if (!record) throw new Error('NOT_FOUND')

  const item = record.items.find((entry) => entry.id === itemId)
  if (!item?.document) throw new Error('DOCUMENT_NOT_FOUND')

  const exists = await storageService.exists(item.document.storageKey)
  if (!exists) throw new Error('DOCUMENT_NOT_FOUND')

  const downloaded = await storageService.download(item.document.storageKey)
  return {
    stream: downloaded.stream,
    mimeType: item.document.mimeType,
    originalName: item.document.originalName,
    size: item.document.size,
  }
}

/** Aprova de uma vez todos os itens enviados (obrigatórios e opcionais) */
export async function approveAllDocumentationItems(applicationId, actorId, auditContext = {}) {
  const record = await prisma.applicationDocumentation.findFirst({
    where: { applicationId, ...notDeleted() },
    include: documentationInclude,
  })
  if (!record) throw new Error('DOCUMENTATION_NOT_FOUND')
  if (!['PENDING_UPLOAD', 'UNDER_REVIEW'].includes(record.status)) {
    throw new Error('INVALID_STATUS')
  }

  const itemsToApprove = record.items.filter((item) => item.status === 'UPLOADED')
  if (!itemsToApprove.length) {
    return getDocumentationByApplicationId(applicationId)
  }

  const reviewedAt = new Date()
  await prisma.applicationDocumentationItem.updateMany({
    where: {
      id: { in: itemsToApprove.map((item) => item.id) },
      status: 'UPLOADED',
    },
    data: {
      status: 'APPROVED',
      rejectionReason: '',
      reviewedById: actorId,
      reviewedAt,
    },
  })

  await createAuditLog({
    actorId,
    action: 'application.documentation_bulk_approve',
    entityType: 'ApplicationDocumentation',
    entityId: record.id,
    metadata: {
      applicationId,
      approvedCount: itemsToApprove.length,
      itemIds: itemsToApprove.map((item) => item.id),
      labels: itemsToApprove.map((item) => item.label),
    },
    ipAddress: auditContext.ipAddress,
  })

  return getDocumentationByApplicationId(applicationId)
}

/** Valida se todos os docs obrigatórios foram enviados e aprovados pelo RH */
export async function assertDocumentationReadyForApproval(applicationId) {
  const documentation = await getDocumentationByApplicationId(applicationId)
  if (!documentation) throw new Error('DOCUMENTATION_NOT_FOUND')

  if (!documentation.progress.allRequiredUploaded) {
    throw new Error('DOCUMENTS_INCOMPLETE')
  }
  if (!documentation.progress.allRequiredApproved) {
    throw new Error('DOCUMENTS_NOT_APPROVED')
  }

  return documentation
}

/** Marca documentação como aprovada e retorna itens para pré-admissão */
export async function markDocumentationApproved(applicationId, actorId, auditContext = {}) {
  const record = await prisma.applicationDocumentation.findFirst({
    where: { applicationId, ...notDeleted() },
    include: documentationInclude,
  })
  if (!record) throw new Error('DOCUMENTATION_NOT_FOUND')

  await prisma.applicationDocumentation.update({
    where: { id: record.id },
    data: { status: 'APPROVED' },
  })

  await createAuditLog({
    actorId,
    action: 'application.documentation_complete',
    entityType: 'ApplicationDocumentation',
    entityId: record.id,
    metadata: { applicationId },
    ipAddress: auditContext.ipAddress,
  })

  return mapDocumentation({ ...record, status: 'APPROVED' })
}

export function mapDocumentationItemsForPreAdmission(documentation) {
  return documentation.items.map((item) => ({
    templateItemId: null,
    slug: item.slug,
    label: item.label,
    description: item.description,
    required: item.required,
    sortOrder: item.sortOrder,
    status: item.status === 'APPROVED' ? 'APPROVED' : item.status === 'UPLOADED' ? 'UPLOADED' : 'PENDING',
    documentId: item.documentId,
    reviewedAt: item.reviewedAt ? new Date(item.reviewedAt) : null,
  }))
}
