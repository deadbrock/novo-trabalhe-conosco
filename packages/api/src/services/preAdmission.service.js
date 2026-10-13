import { prisma, notDeleted, softDeleteData } from '../lib/prisma.js'
import { storageService } from '../storage/index.js'
import { createAuditLog } from './audit.service.js'
import { moveApplicationStage } from './pipeline.service.js'
import { getResumeExtension } from './resume.service.js'
import { getChecklistItemMeta } from '../constants/documentChecklist.js'
import { APPROVED_STAGE } from '../utils/pipelineStages.js'
import { mapApplicationSla } from './sla.service.js'

export const PRE_ADMISSION_STATUS_LABELS = {
  PENDING_DOCS: 'Aguardando documentos',
  UNDER_REVIEW: 'Em análise RH',
  FORWARDED_TO_DP: 'Encaminhado ao DP',
  APPROVED: 'Aprovado pelo DP',
  REJECTED: 'Reprovado',
  HIRED: 'Contratado',
}

export const CHECKLIST_ITEM_STATUS_LABELS = {
  PENDING: 'Pendente',
  UPLOADED: 'Enviado',
  APPROVED: 'Aprovado',
  REJECTED: 'Reprovado',
}

const caseInclude = {
  application: {
    include: {
      candidate: {
        include: {
          user: { select: { id: true, email: true } },
        },
      },
      job: { select: { id: true, title: true, slug: true, stateCode: true } },
      unit: true,
      slaClocks: true,
    },
  },
  forwardedBy: { include: { staffProfile: true } },
  documentation: {
    include: {
      items: {
        where: notDeleted(),
        orderBy: { sortOrder: 'asc' },
        include: {
          document: true,
          reviewedBy: { include: { staffProfile: true } },
        },
      },
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

function getEffectiveChecklistItems(record) {
  if (record.documentation?.items?.length) {
    return record.documentation.items
  }
  return record.items || []
}

function mapChecklistItem(item) {
  const meta = getChecklistItemMeta(item.slug || '', item.label)
  return {
    id: item.id,
    label: item.label,
    description: item.description,
    helpUrl: meta.helpUrl,
    required: item.required,
    sortOrder: item.sortOrder,
    status: item.status,
    statusLabel: CHECKLIST_ITEM_STATUS_LABELS[item.status] || item.status,
    rejectionReason: item.rejectionReason || '',
    documentId: item.documentId,
    documentFileName: item.document?.originalName || null,
    documentMimeType: item.document?.mimeType || null,
    documentSize: item.document?.size || 0,
    reviewedByName: item.reviewedBy?.staffProfile?.name || null,
    reviewedAt: item.reviewedAt?.toISOString() || null,
  }
}

function mapPreAdmissionCase(record) {
  const app = record.application
  const items = getEffectiveChecklistItems(record)
  const usesLinkedDocumentation = Boolean(record.documentationId && record.documentation)
  const requiredItems = items.filter((item) => item.required)
  const uploadedRequired = requiredItems.filter((item) =>
    ['UPLOADED', 'APPROVED'].includes(item.status),
  ).length
  const approvedRequired = requiredItems.filter((item) => item.status === 'APPROVED').length

  return {
    id: record.id,
    applicationId: record.applicationId,
    documentationId: record.documentationId || null,
    usesLinkedDocumentation,
    status: record.status,
    statusLabel: PRE_ADMISSION_STATUS_LABELS[record.status] || record.status,
    candidateUserId: app?.candidate?.user?.id || null,
    candidateName: app?.candidate?.name || '',
    candidateEmail: app?.candidate?.user?.email || '',
    jobId: app?.jobId,
    jobTitle: app?.job?.title || '',
    forwardedToDpAt: record.forwardedToDpAt?.toISOString() || null,
    forwardedByName: record.forwardedBy?.staffProfile?.name || null,
    dpNotes: record.dpNotes || '',
    rejectionReason: record.rejectionReason || '',
    rejectedAt: record.rejectedAt?.toISOString() || null,
    hiredAt: record.hiredAt?.toISOString() || null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    progress: {
      totalRequired: requiredItems.length,
      uploadedRequired,
      approvedRequired,
      allRequiredUploaded: requiredItems.length > 0 && uploadedRequired === requiredItems.length,
      allRequiredApproved: requiredItems.length > 0 && approvedRequired === requiredItems.length,
    },
    canForwardToDp:
      record.status === 'UNDER_REVIEW' &&
      requiredItems.length > 0 &&
      approvedRequired === requiredItems.length,
    origin: {
      unitId: app?.unit?.id || app?.unitId || null,
      unitName: app?.unit?.name || null,
      stateCode: app?.job?.stateCode || '',
      currentOwner: app?.currentOwner || 'LOCAL',
      returnedReason: app?.returnedReason || '',
    },
    sla: mapApplicationSla(app),
    items: items.map(mapChecklistItem),
  }
}

async function getDefaultTemplate() {
  return prisma.documentChecklistTemplate.findFirst({
    where: { isDefault: true, isActive: true, ...notDeleted() },
    include: {
      items: {
        where: notDeleted(),
        orderBy: { sortOrder: 'asc' },
      },
    },
  })
}

async function refreshCaseStatus(caseId) {
  const record = await prisma.preAdmissionCase.findFirst({
    where: { id: caseId, ...notDeleted() },
    include: {
      items: { where: notDeleted() },
    },
  })
  if (!record || ['REJECTED', 'HIRED', 'FORWARDED_TO_DP', 'APPROVED'].includes(record.status)) {
    return
  }

  const requiredItems = record.items.filter((item) => item.required)
  const allUploaded = requiredItems.every((item) =>
    ['UPLOADED', 'APPROVED', 'REJECTED'].includes(item.status),
  )
  const hasPendingUpload = requiredItems.some((item) => item.status === 'PENDING')

  if (record.status === 'PENDING_DOCS' && allUploaded && !hasPendingUpload) {
    await prisma.preAdmissionCase.update({
      where: { id: caseId },
      data: { status: 'UNDER_REVIEW' },
    })
  }
}

async function linkPreAdmissionCaseToDocumentation(caseId) {
  const record = await prisma.preAdmissionCase.findFirst({
    where: { id: caseId, ...notDeleted() },
    include: {
      items: { where: notDeleted(), include: { document: true } },
    },
  })
  if (!record || record.documentationId) return false

  const { ensureApplicationDocumentation } = await import('./applicationDocumentation.service.js')
  const documentation = await ensureApplicationDocumentation(record.applicationId, null, {})

  const docRecord = await prisma.applicationDocumentation.findFirst({
    where: { id: documentation.id, ...notDeleted() },
    include: { items: { where: notDeleted() } },
  })
  if (!docRecord) return false

  for (const oldItem of record.items) {
    if (!oldItem.documentId) continue
    const target = docRecord.items.find((item) => item.label === oldItem.label)
    if (!target || target.documentId) continue

    await prisma.applicationDocumentationItem.update({
      where: { id: target.id },
      data: {
        documentId: oldItem.documentId,
        status: oldItem.status === 'APPROVED' ? 'APPROVED' : 'UPLOADED',
        reviewedAt: oldItem.reviewedAt,
        reviewedById: oldItem.reviewedById,
      },
    })
  }

  const refreshedDoc = await prisma.applicationDocumentation.findFirst({
    where: { id: docRecord.id, ...notDeleted() },
    include: { items: { where: notDeleted() } },
  })

  const requiredItems = refreshedDoc.items.filter((item) => item.required)
  const allApproved =
    requiredItems.length > 0 && requiredItems.every((item) => item.status === 'APPROVED')

  let status = record.status
  if (['PENDING_DOCS', 'UNDER_REVIEW'].includes(record.status)) {
    status = allApproved ? 'UNDER_REVIEW' : 'PENDING_DOCS'
  }

  if (record.items.length) {
    await prisma.preAdmissionChecklistItem.updateMany({
      where: { caseId: record.id, deletedAt: null },
      data: softDeleteData(),
    })
  }

  await prisma.preAdmissionCase.update({
    where: { id: record.id },
    data: {
      documentationId: refreshedDoc.id,
      status,
    },
  })

  return true
}

/** Vincula casos antigos de pré-admissão à documentação da candidatura */
export async function syncPreAdmissionDocumentationLinks() {
  const cases = await prisma.preAdmissionCase.findMany({
    where: { documentationId: null, ...notDeleted() },
    select: { id: true },
  })

  let linked = 0
  for (const entry of cases) {
    if (await linkPreAdmissionCaseToDocumentation(entry.id)) {
      linked += 1
    }
  }

  return linked
}

export async function createPreAdmissionCaseForApplication(applicationId, actorId, auditContext = {}) {
  const existing = await prisma.preAdmissionCase.findFirst({
    where: { applicationId, ...notDeleted() },
  })
  if (existing) {
    if (!existing.documentationId) {
      await linkPreAdmissionCaseToDocumentation(existing.id)
    }
    return mapPreAdmissionCase(await loadCase(existing.id))
  }

  const application = await prisma.application.findFirst({
    where: { id: applicationId, ...notDeleted() },
    include: {
      job: { select: { title: true } },
      candidate: { select: { name: true } },
      documentation: {
        where: notDeleted(),
        include: {
          items: { where: notDeleted() },
        },
      },
    },
  })
  if (!application) throw new Error('APPLICATION_NOT_FOUND')

  const documentation = application.documentation
  const template = await getDefaultTemplate()

  let initialStatus = 'PENDING_DOCS'
  let documentationId = null
  const itemCreates = []

  if (documentation) {
    documentationId = documentation.id
    const requiredItems = documentation.items.filter((item) => item.required)
    const allApproved = requiredItems.every((item) => item.status === 'APPROVED')
    initialStatus = allApproved ? 'UNDER_REVIEW' : 'PENDING_DOCS'
  } else if (template) {
    for (const item of template.items) {
      itemCreates.push({
        templateItemId: item.id,
        label: item.label,
        description: item.description,
        required: item.required,
        sortOrder: item.sortOrder,
      })
    }
  } else {
    throw new Error('CHECKLIST_TEMPLATE_NOT_FOUND')
  }

  const record = await prisma.preAdmissionCase.create({
    data: {
      applicationId,
      documentationId,
      templateId: template?.id || documentation?.templateId || null,
      status: initialStatus,
      ...(itemCreates.length
        ? {
            items: { create: itemCreates },
          }
        : {}),
    },
    include: caseInclude,
  })

  await createAuditLog({
    actorId,
    action: 'pre_admission.create',
    entityType: 'PreAdmissionCase',
    entityId: record.id,
    metadata: {
      applicationId,
      jobTitle: application.job.title,
      candidateName: application.candidate.name,
    },
    ipAddress: auditContext.ipAddress,
  })

  return mapPreAdmissionCase(record)
}

/** Cria casos de pré-admissão para candidatos já aprovados antes da Fase 7 */
export async function syncMissingPreAdmissionCases(actorId = null) {
  const approvedApplications = await prisma.application.findMany({
    where: {
      currentStage: APPROVED_STAGE,
      status: { notIn: ['REJECTED', 'WITHDRAWN'] },
      ...notDeleted(),
      preAdmission: null,
    },
    select: { id: true },
  })

  let created = 0
  for (const application of approvedApplications) {
    try {
      await createPreAdmissionCaseForApplication(application.id, actorId, {})
      created += 1
    } catch (error) {
      if (error.message !== 'CHECKLIST_TEMPLATE_NOT_FOUND') {
        throw error
      }
    }
  }

  return created
}

async function loadCase(id) {
  const record = await prisma.preAdmissionCase.findFirst({
    where: { id, ...notDeleted() },
    include: caseInclude,
  })
  if (!record) throw new Error('NOT_FOUND')
  return record
}

export async function getPreAdmissionStats() {
  const statuses = ['PENDING_DOCS', 'UNDER_REVIEW', 'FORWARDED_TO_DP', 'APPROVED', 'REJECTED', 'HIRED']
  const counts = await Promise.all(
    statuses.map((status) =>
      prisma.preAdmissionCase.count({ where: { status, ...notDeleted() } }),
    ),
  )

  const pendingDocs = counts[0] + counts[1]
  const awaitingDp = counts[2]
  const approved = counts[3]
  const rejected = counts[4]
  const hired = counts[5]

  return {
    pendingDocs,
    underReview: counts[1],
    awaitingDp,
    approved,
    rejected,
    hired,
    total: counts.reduce((sum, value) => sum + value, 0),
  }
}

export async function listPreAdmissionCases(filters = {}) {
  await syncMissingPreAdmissionCases()
  await syncPreAdmissionDocumentationLinks()

  const where = { ...notDeleted() }

  if (filters.status && filters.status !== 'undefined') {
    where.status = filters.status
  } else {
    where.status = { in: ['PENDING_DOCS', 'UNDER_REVIEW'] }
  }

  if (filters.search?.trim()) {
    const term = filters.search.trim()
    where.application = {
      ...notDeleted(),
      OR: [
        { candidate: { name: { contains: term, mode: 'insensitive' } } },
        { job: { title: { contains: term, mode: 'insensitive' } } },
      ],
    }
  }

  const records = await prisma.preAdmissionCase.findMany({
    where,
    include: caseInclude,
    orderBy: { updatedAt: 'desc' },
  })

  return records.map(mapPreAdmissionCase)
}

export async function listHrDepartmentCases(filters = {}) {
  await syncPreAdmissionDocumentationLinks()
  const where = {
    ...notDeleted(),
    status: filters.status && filters.status !== 'undefined'
      ? filters.status
      : { in: ['FORWARDED_TO_DP', 'APPROVED'] },
  }

  if (filters.search?.trim()) {
    const term = filters.search.trim()
    where.application = {
      ...notDeleted(),
      OR: [
        { candidate: { name: { contains: term, mode: 'insensitive' } } },
        { job: { title: { contains: term, mode: 'insensitive' } } },
      ],
    }
  }

  const records = await prisma.preAdmissionCase.findMany({
    where,
    include: caseInclude,
    orderBy: { updatedAt: 'desc' },
  })

  return records.map(mapPreAdmissionCase)
}

export async function getPreAdmissionCase(id) {
  const record = await prisma.preAdmissionCase.findFirst({
    where: { id, ...notDeleted() },
    select: { id: true, documentationId: true },
  })
  if (record && !record.documentationId) {
    await linkPreAdmissionCaseToDocumentation(record.id)
  }
  return mapPreAdmissionCase(await loadCase(id))
}

export async function forwardPreAdmissionToDp(caseId, actorId, auditContext = {}) {
  const record = await loadCase(caseId)

  if (!['UNDER_REVIEW', 'PENDING_DOCS'].includes(record.status)) {
    throw new Error('INVALID_STATUS')
  }

  const requiredItems = getEffectiveChecklistItems(record).filter((item) => item.required)
  const allApproved = requiredItems.every((item) => item.status === 'APPROVED')
  if (!allApproved) throw new Error('ITEMS_NOT_APPROVED')

  const updated = await prisma.preAdmissionCase.update({
    where: { id: caseId },
    data: {
      status: 'FORWARDED_TO_DP',
      forwardedToDpAt: new Date(),
      forwardedById: actorId,
    },
    include: caseInclude,
  })

  await createAuditLog({
    actorId,
    action: 'pre_admission.forward_to_dp',
    entityType: 'PreAdmissionCase',
    entityId: caseId,
    metadata: {
      jobTitle: updated.application.job.title,
      candidateName: updated.application.candidate.name,
    },
    ipAddress: auditContext.ipAddress,
  })

  const { markForwardedToDp } = await import('./sla.service.js')
  await markForwardedToDp(updated.applicationId)

  return mapPreAdmissionCase(await loadCase(caseId))
}

export async function reviewChecklistItem(caseId, itemId, decision, reason, actorId, auditContext = {}) {
  const record = await loadCase(caseId)
  if (record.documentationId) {
    const { reviewDocumentationItem } = await import('./applicationDocumentation.service.js')
    await reviewDocumentationItem(
      record.documentationId,
      itemId,
      decision,
      reason,
      actorId,
      auditContext,
    )
    return getPreAdmissionCase(caseId)
  }
  if (!['PENDING_DOCS', 'UNDER_REVIEW'].includes(record.status)) {
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

  await prisma.preAdmissionChecklistItem.update({
    where: { id: itemId },
    data: {
      status: decision === 'approved' ? 'APPROVED' : 'REJECTED',
      rejectionReason: decision === 'rejected' ? String(reason || '').trim() : '',
      reviewedById: actorId,
      reviewedAt: new Date(),
    },
  })

  await refreshCaseStatus(caseId)

  await createAuditLog({
    actorId,
    action: decision === 'approved' ? 'pre_admission.item_approve' : 'pre_admission.item_reject',
    entityType: 'PreAdmissionChecklistItem',
    entityId: itemId,
    metadata: {
      caseId,
      label: item.label,
      reason: decision === 'rejected' ? String(reason || '').trim() : undefined,
    },
    ipAddress: auditContext.ipAddress,
  })

  return getPreAdmissionCase(caseId)
}

export async function uploadChecklistItemDocument(
  caseId,
  itemId,
  file,
  actorId,
  auditContext = {},
  { isCandidate = false } = {},
) {
  const record = await loadCase(caseId)
  if (record.documentationId) {
    const { uploadDocumentationItem } = await import('./applicationDocumentation.service.js')
    await uploadDocumentationItem(
      record.documentationId,
      itemId,
      file,
      actorId,
      auditContext,
      { isCandidate },
    )
    return getPreAdmissionCase(caseId)
  }
  if (['REJECTED', 'HIRED', 'FORWARDED_TO_DP', 'APPROVED'].includes(record.status)) {
    throw new Error('INVALID_STATUS')
  }

  const item = record.items.find((entry) => entry.id === itemId)
  if (!item) throw new Error('ITEM_NOT_FOUND')

  const candidateProfileId = record.application.candidateId
  const ext = getResumeExtension(file.mimetype, file.originalname)
  const key = `pre-admission/${caseId}/${itemId}-${Date.now()}${ext}`

  if (item.documentId) {
    const previous = await prisma.document.findFirst({ where: { id: item.documentId } })
    if (previous) {
      await storageService.delete(previous.storageKey).catch(() => {})
      await prisma.document.update({ where: { id: previous.id }, data: softDeleteData() })
    }
  }

  const stored = await storageService.upload(file, { key, directory: 'pre-admission' })

  const document = await prisma.document.create({
    data: {
      ownerType: 'PRE_ADMISSION',
      ownerId: itemId,
      candidateId: candidateProfileId,
      type: 'pre_admission',
      storageKey: stored.key,
      provider: stored.provider,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    },
  })

  await prisma.preAdmissionChecklistItem.update({
    where: { id: itemId },
    data: {
      documentId: document.id,
      status: 'UPLOADED',
      rejectionReason: '',
      reviewedById: null,
      reviewedAt: null,
    },
  })

  if (record.status === 'PENDING_DOCS') {
    await refreshCaseStatus(caseId)
  }

  await createAuditLog({
    actorId,
    action: isCandidate ? 'pre_admission.candidate_upload' : 'pre_admission.staff_upload',
    entityType: 'PreAdmissionChecklistItem',
    entityId: itemId,
    metadata: { caseId, label: item.label, fileName: file.originalname },
    ipAddress: auditContext.ipAddress,
  })

  return getPreAdmissionCase(caseId)
}

export async function streamChecklistItemDocument(caseId, itemId) {
  const record = await loadCase(caseId)

  if (record.documentationId) {
    const { streamDocumentationItemDocument } = await import('./applicationDocumentation.service.js')
    return streamDocumentationItemDocument(record.documentationId, itemId)
  }

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

export async function reviewHrDepartmentCase(caseId, decision, notes, reason, actorId, auditContext = {}) {
  const record = await loadCase(caseId)
  if (record.status !== 'FORWARDED_TO_DP') throw new Error('INVALID_STATUS')

  if (decision === 'returned') {
    const trimmedReason = String(reason || '').trim()
    if (!trimmedReason) throw new Error('VALIDATION')

    const updated = await prisma.preAdmissionCase.update({
      where: { id: caseId },
      data: {
        status: 'UNDER_REVIEW',
        rejectionReason: trimmedReason,
        rejectedAt: new Date(),
        dpNotes: String(notes || '').trim(),
      },
      include: caseInclude,
    })

    const { returnAdmissionToRh } = await import('./sla.service.js')
    await returnAdmissionToRh(updated.applicationId, trimmedReason)

    await createAuditLog({
      actorId,
      action: 'pre_admission.dp_return',
      entityType: 'PreAdmissionCase',
      entityId: caseId,
      metadata: { reason: trimmedReason, jobTitle: updated.application.job.title },
      ipAddress: auditContext.ipAddress,
    })

    return mapPreAdmissionCase(await loadCase(caseId))
  }

  if (decision === 'rejected') {
    const trimmedReason = String(reason || '').trim()
    if (!trimmedReason) throw new Error('VALIDATION')

    const updated = await prisma.preAdmissionCase.update({
      where: { id: caseId },
      data: {
        status: 'REJECTED',
        rejectionReason: trimmedReason,
        rejectedAt: new Date(),
        dpNotes: String(notes || '').trim(),
      },
      include: caseInclude,
    })

    await createAuditLog({
      actorId,
      action: 'pre_admission.dp_reject',
      entityType: 'PreAdmissionCase',
      entityId: caseId,
      metadata: { reason: trimmedReason, jobTitle: updated.application.job.title },
      ipAddress: auditContext.ipAddress,
    })

    return mapPreAdmissionCase(updated)
  }

  if (decision !== 'approved') throw new Error('VALIDATION')

  const updated = await prisma.preAdmissionCase.update({
    where: { id: caseId },
    data: {
      status: 'APPROVED',
      dpNotes: String(notes || '').trim(),
    },
    include: caseInclude,
  })

  await createAuditLog({
    actorId,
    action: 'pre_admission.dp_approve',
    entityType: 'PreAdmissionCase',
    entityId: caseId,
    metadata: { jobTitle: updated.application.job.title },
    ipAddress: auditContext.ipAddress,
  })

  return mapPreAdmissionCase(updated)
}

export async function markPreAdmissionHired(caseId, actorId, auditContext = {}) {
  const record = await loadCase(caseId)
  if (!['APPROVED', 'FORWARDED_TO_DP'].includes(record.status)) throw new Error('INVALID_STATUS')

  await moveApplicationStage(record.applicationId, 'hired', actorId, auditContext)

  const { markDpAdmissionCompleted } = await import('./sla.service.js')
  await markDpAdmissionCompleted(record.applicationId)

  const updated = await prisma.preAdmissionCase.update({
    where: { id: caseId },
    data: {
      status: 'HIRED',
      hiredAt: new Date(),
    },
    include: caseInclude,
  })

  await createAuditLog({
    actorId,
    action: 'pre_admission.hire',
    entityType: 'PreAdmissionCase',
    entityId: caseId,
    metadata: {
      applicationId: record.applicationId,
      jobTitle: updated.application.job.title,
    },
    ipAddress: auditContext.ipAddress,
  })

  return mapPreAdmissionCase(updated)
}

export async function listCandidatePreAdmissionCases(userId) {
  const profile = await prisma.candidateProfile.findFirst({
    where: { userId, ...notDeleted() },
    select: { id: true },
  })
  if (!profile) return []

  const records = await prisma.preAdmissionCase.findMany({
    where: {
      ...notDeleted(),
      status: { notIn: ['REJECTED', 'HIRED'] },
      application: { candidateId: profile.id, ...notDeleted() },
    },
    include: caseInclude,
    orderBy: { updatedAt: 'desc' },
  })

  return records.map(mapPreAdmissionCase)
}

export async function getCandidatePreAdmissionCase(userId, caseId) {
  const profile = await prisma.candidateProfile.findFirst({
    where: { userId, ...notDeleted() },
    select: { id: true },
  })
  if (!profile) throw new Error('NOT_FOUND')

  const record = await prisma.preAdmissionCase.findFirst({
    where: {
      id: caseId,
      ...notDeleted(),
      application: { candidateId: profile.id, ...notDeleted() },
    },
    include: caseInclude,
  })
  if (!record) throw new Error('NOT_FOUND')

  return mapPreAdmissionCase(record)
}

export async function countPendingPreAdmissionDocuments() {
  const cases = await prisma.preAdmissionCase.findMany({
    where: {
      status: { in: ['PENDING_DOCS', 'UNDER_REVIEW', 'FORWARDED_TO_DP'] },
      ...notDeleted(),
    },
    include: {
      documentation: {
        include: {
          items: { where: { ...notDeleted(), required: true } },
        },
      },
      items: { where: { ...notDeleted(), required: true } },
    },
  })

  let pendingItems = 0
  for (const record of cases) {
    const items = getEffectiveChecklistItems(record)
    pendingItems += items.filter((item) =>
      item.required && ['PENDING', 'UPLOADED', 'REJECTED'].includes(item.status),
    ).length
  }

  return {
    pendingDocuments: pendingItems,
    activeCases: cases.length,
    awaitingDp: cases.filter((record) => record.status === 'FORWARDED_TO_DP').length,
  }
}
