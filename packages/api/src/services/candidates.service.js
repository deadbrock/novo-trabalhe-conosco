import { prisma, notDeleted } from '../lib/prisma.js'
import { getUserResumeFile } from './resume.service.js'
import { storageService } from '../storage/index.js'
import { createAuditLog } from './audit.service.js'
import {
  mapStoredProfile,
  formatFullAddress,
  educationLevelLabel,
} from '../utils/candidateProfile.js'
import { moveApplicationStage } from './pipeline.service.js'
import {
  APPROVED_STAGE,
  DOCUMENTATION_STAGE,
  pipelineStageLabel,
} from '../utils/pipelineStages.js'

const TIMELINE_LABELS = {
  'candidate.register': 'Cadastro no portal',
  'candidate.verify_email': 'E-mail verificado',
  'candidate.login': 'Login no portal',
  'candidate.update_profile': 'Perfil atualizado',
  'candidate.upload_resume': 'Currículo enviado',
  'candidate.delete_resume': 'Currículo removido',
  'application.create': 'Candidatura realizada',
  'pipeline.move': 'Movido no pipeline',
  'candidate.note_create': 'Nota adicionada',
  'interview.send_to_documentation': 'Aprovado na entrevista — enviado para documentação',
  'application.approve_documentation': 'Documentação aprovada',
  'application.reject': 'Candidatura reprovada',
  'pre_admission.create': 'Pré-admissão iniciada',
  'pre_admission.forward_to_dp': 'Encaminhado ao DP',
  'pre_admission.dp_approve': 'Documentação aprovada pelo DP',
  'pre_admission.dp_reject': 'Reprovado pelo DP',
  'pre_admission.hire': 'Contratado',
}

const listInclude = {
  candidateProfile: {
    include: {
      documents: {
        where: { ...notDeleted(), type: 'resume' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { originalName: true },
      },
      applications: {
        where: notDeleted(),
        select: {
          id: true,
          status: true,
          rejectionReason: true,
          rejectedAt: true,
          job: { select: { title: true } },
        },
      },
    },
  },
}

const detailInclude = {
  candidateProfile: {
    include: {
      documents: {
        where: { ...notDeleted(), type: 'resume' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      applications: {
        where: notDeleted(),
        include: {
          job: { select: { id: true, title: true, slug: true, status: true } },
          preAdmission: {
            where: notDeleted(),
            select: { id: true, status: true },
          },
          documentation: {
            where: notDeleted(),
            include: {
              items: {
                where: notDeleted(),
                orderBy: { sortOrder: 'asc' },
                include: {
                  document: { select: { id: true, originalName: true, mimeType: true, size: true } },
                  reviewedBy: { include: { staffProfile: { select: { name: true } } } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  },
}

function mapCandidateListItem(user) {
  const profile = user.candidateProfile
  const resume = profile?.documents?.[0]
  const applications = profile?.applications ?? []
  const rejectedApplications = applications
    .filter((app) => app.status === 'REJECTED')
    .sort((a, b) => new Date(b.rejectedAt || 0) - new Date(a.rejectedAt || 0))
  const latestRejection = rejectedApplications[0]

  return {
    id: user.id,
    profileId: profile?.id,
    name: profile?.name || '',
    email: user.email,
    phone: profile?.phone || '',
    city: profile?.city || '',
    state: profile?.state || '',
    status: user.status,
    emailVerified: user.emailVerified,
    applicationsCount: applications.length,
    rejectedApplicationsCount: rejectedApplications.length,
    latestRejection: latestRejection
      ? {
          applicationId: latestRejection.id,
          jobTitle: latestRejection.job?.title || '',
          reason: latestRejection.rejectionReason || '',
          rejectedAt: latestRejection.rejectedAt?.toISOString() || null,
        }
      : null,
    hasResume: Boolean(resume),
    resumeFileName: resume?.originalName || null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}

function mapDocumentationSummary(documentation) {
  if (!documentation) return null

  const items = documentation.items || []
  const requiredItems = items.filter((item) => item.required)
  const uploadedRequired = requiredItems.filter((item) =>
    ['UPLOADED', 'APPROVED'].includes(item.status),
  ).length
  const approvedRequired = requiredItems.filter((item) => item.status === 'APPROVED').length

  return {
    id: documentation.id,
    status: documentation.status,
    progress: {
      totalRequired: requiredItems.length,
      uploadedRequired,
      approvedRequired,
      allRequiredUploaded: requiredItems.length > 0 && uploadedRequired === requiredItems.length,
      allRequiredApproved: requiredItems.length > 0 && approvedRequired === requiredItems.length,
    },
    items: items.map((item) => ({
      id: item.id,
      slug: item.slug,
      label: item.label,
      description: item.description,
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
    })),
  }
}

function mapApplication(app) {
  const documentation = mapDocumentationSummary(app.documentation)
  const canReviewDocumentation =
    app.currentStage === DOCUMENTATION_STAGE &&
    app.status !== 'REJECTED' &&
    app.status !== 'WITHDRAWN'

  return {
    id: app.id,
    jobId: app.jobId,
    jobTitle: app.job.title,
    jobSlug: app.job.slug,
    jobStatus: app.job.status,
    status: app.status,
    currentStage: app.currentStage,
    currentStageLabel: pipelineStageLabel(app.currentStage),
    rejectionReason: app.rejectionReason || '',
    rejectedAt: app.rejectedAt?.toISOString() || null,
    canReviewDocumentation,
    canApproveDocumentation:
      canReviewDocumentation &&
      Boolean(documentation?.progress.allRequiredUploaded),
    documentation,
    preAdmissionCaseId: app.preAdmission?.id || null,
    preAdmissionStatus: app.preAdmission?.status || null,
    inPreAdmission: Boolean(app.preAdmission?.id),
    inHrDepartment: ['FORWARDED_TO_DP', 'APPROVED', 'HIRED'].includes(app.preAdmission?.status),
    source: app.source,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  }
}

function mapCandidateDetail(user) {
  const profile = user.candidateProfile
  const resume = profile?.documents?.[0]
  const base = mapCandidateListItem(user)
  const storedProfile = mapStoredProfile(profile)

  return {
    ...base,
    ...storedProfile,
    educationLevelLabel: educationLevelLabel(storedProfile.educationLevel),
    fullAddress: formatFullAddress(storedProfile),
    linkedin: storedProfile.linkedin,
    summary: storedProfile.summary,
    resumeMimeType: resume?.mimeType || null,
    resumeSize: resume?.size || 0,
    resumeUploadedAt: resume?.createdAt?.toISOString() || null,
    applications: (profile?.applications || []).map(mapApplication),
  }
}

function buildWhere(filters = {}) {
  const profileFilter = { ...notDeleted() }

  if (filters.state && filters.state !== 'undefined') {
    profileFilter.state = filters.state
  }

  if (filters.rejectedOnly === 'true') {
    profileFilter.applications = {
      some: { status: 'REJECTED', ...notDeleted() },
    }
  } else {
    profileFilter.applications = {
      none: { status: 'REJECTED', ...notDeleted() },
    }
  }

  const where = {
    type: 'CANDIDATE',
    ...notDeleted(),
    candidateProfile: profileFilter,
  }

  if (filters.status && filters.status !== 'undefined') {
    where.status = filters.status
  }

  if (filters.emailVerified === 'true') {
    where.emailVerified = true
  } else if (filters.emailVerified === 'false') {
    where.emailVerified = false
  }

  if (filters.search?.trim()) {
    const term = filters.search.trim()
    where.OR = [
      { email: { contains: term, mode: 'insensitive' }, candidateProfile: profileFilter },
      {
        candidateProfile: {
          ...profileFilter,
          name: { contains: term, mode: 'insensitive' },
        },
      },
      {
        candidateProfile: {
          ...profileFilter,
          city: { contains: term, mode: 'insensitive' },
        },
      },
    ]
    delete where.candidateProfile
  }

  return where
}

export async function listCandidatesAdmin(filters = {}) {
  const users = await prisma.user.findMany({
    where: buildWhere(filters),
    include: listInclude,
    orderBy: { createdAt: 'desc' },
  })

  let items = users.map(mapCandidateListItem)

  if (filters.hasApplications === 'true') {
    items = items.filter((c) => c.applicationsCount > 0)
  } else if (filters.hasApplications === 'false') {
    items = items.filter((c) => c.applicationsCount === 0)
  }

  return items
}

export async function getCandidateAdmin(id) {
  const { syncMissingApplicationDocumentations } = await import('./applicationDocumentation.service.js')
  await syncMissingApplicationDocumentations()

  const user = await prisma.user.findFirst({
    where: { id, type: 'CANDIDATE', ...notDeleted() },
    include: detailInclude,
  })
  if (!user?.candidateProfile) return null
  return mapCandidateDetail(user)
}

export async function getCandidateStats() {
  const base = { type: 'CANDIDATE', ...notDeleted(), candidateProfile: { ...notDeleted() } }

  const [total, active, pending, verified, withApplications, rejected] = await Promise.all([
    prisma.user.count({ where: base }),
    prisma.user.count({ where: { ...base, status: 'ACTIVE' } }),
    prisma.user.count({ where: { ...base, status: 'PENDING' } }),
    prisma.user.count({ where: { ...base, emailVerified: true } }),
    prisma.user.count({
      where: {
        ...base,
        candidateProfile: {
          ...notDeleted(),
          applications: { some: { ...notDeleted() } },
        },
      },
    }),
    prisma.user.count({
      where: {
        ...base,
        candidateProfile: {
          ...notDeleted(),
          applications: { some: { status: 'REJECTED', ...notDeleted() } },
        },
      },
    }),
  ])

  return { total, active, pending, verified, withApplications, rejected }
}

export async function listCandidateStates() {
  const rows = await prisma.candidateProfile.findMany({
    where: { ...notDeleted(), state: { not: '' } },
    select: { state: true },
    distinct: ['state'],
    orderBy: { state: 'asc' },
  })
  return rows.map((r) => r.state)
}

export async function streamCandidateResumeAdmin(userId) {
  const resume = await getUserResumeFile(userId)
  if (!resume) return null

  const downloaded = await storageService.download(resume.storageKey)
  return {
    stream: downloaded.stream,
    mimeType: resume.mimeType,
    originalName: resume.originalName,
  }
}

function mapNote(note) {
  return {
    id: note.id,
    content: note.content,
    authorName: note.author?.staffProfile?.name || note.author?.email || 'Equipe',
    authorId: note.authorId,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  }
}

async function getCandidateContext(userId) {
  const user = await prisma.user.findFirst({
    where: { id: userId, type: 'CANDIDATE', ...notDeleted() },
    include: {
      candidateProfile: {
        include: {
          applications: { where: notDeleted(), select: { id: true } },
        },
      },
    },
  })

  if (!user?.candidateProfile) return null

  return {
    user,
    profileId: user.candidateProfile.id,
    applicationIds: user.candidateProfile.applications.map((app) => app.id),
  }
}

function mapActorName(actor) {
  if (!actor) return null
  if (actor.staffProfile?.name) return actor.staffProfile.name
  if (actor.candidateProfile?.name) return actor.candidateProfile.name
  return actor.email || null
}

function describeAuditEvent(log) {
  const metadata = log.metadata || {}

  switch (log.action) {
    case 'application.create':
      return metadata.jobTitle ? `Vaga: ${metadata.jobTitle}` : ''
    case 'pipeline.move':
      if (metadata.jobTitle && metadata.fromStage && metadata.toStage) {
        return `${metadata.jobTitle} · ${pipelineStageLabel(metadata.fromStage)} → ${pipelineStageLabel(metadata.toStage)}`
      }
      if (metadata.fromStage && metadata.toStage) {
        return `${pipelineStageLabel(metadata.fromStage)} → ${pipelineStageLabel(metadata.toStage)}`
      }
      return metadata.jobTitle || ''
    case 'application.reject':
      return metadata.reason ? `Motivo: ${metadata.reason}` : metadata.jobTitle || ''
    case 'application.approve_documentation':
      return metadata.jobTitle ? `Vaga: ${metadata.jobTitle}` : ''
    case 'interview.send_to_documentation':
      return metadata.jobTitle ? `Vaga: ${metadata.jobTitle}` : ''
    case 'pre_admission.create':
      return metadata.jobTitle ? `Vaga: ${metadata.jobTitle}` : ''
    case 'pre_admission.forward_to_dp':
      return metadata.jobTitle ? `Vaga: ${metadata.jobTitle}` : ''
    case 'pre_admission.dp_reject':
      return metadata.reason ? `Motivo: ${metadata.reason}` : metadata.jobTitle || ''
    case 'pre_admission.dp_approve':
      return metadata.jobTitle ? `Vaga: ${metadata.jobTitle}` : ''
    case 'pre_admission.hire':
      return metadata.jobTitle ? `Vaga: ${metadata.jobTitle}` : ''
    default:
      return ''
  }
}

function mapTimelineEvent(log) {
  return {
    id: log.id,
    type: log.action,
    title: TIMELINE_LABELS[log.action] || log.action,
    description: describeAuditEvent(log),
    actor: mapActorName(log.actor),
    createdAt: log.createdAt.toISOString(),
  }
}

export async function listCandidateNotes(userId) {
  const context = await getCandidateContext(userId)
  if (!context) return null

  const notes = await prisma.candidateNote.findMany({
    where: { candidateId: context.profileId, ...notDeleted() },
    include: {
      author: {
        include: { staffProfile: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return notes.map(mapNote)
}

export async function createCandidateNote(userId, authorId, content, auditContext = {}) {
  const context = await getCandidateContext(userId)
  if (!context) throw new Error('NOT_FOUND')

  const trimmed = String(content || '').trim()
  if (!trimmed) throw new Error('VALIDATION')

  const note = await prisma.candidateNote.create({
    data: {
      candidateId: context.profileId,
      authorId,
      content: trimmed,
    },
    include: {
      author: {
        include: { staffProfile: true },
      },
    },
  })

  await createAuditLog({
    actorId: authorId,
    action: 'candidate.note_create',
    entityType: 'CandidateProfile',
    entityId: context.profileId,
    metadata: { noteId: note.id },
    ipAddress: auditContext.ipAddress,
  })

  return mapNote(note)
}

export async function deleteCandidateNote(userId, noteId, actorId, auditContext = {}) {
  const context = await getCandidateContext(userId)
  if (!context) throw new Error('NOT_FOUND')

  const note = await prisma.candidateNote.findFirst({
    where: { id: noteId, candidateId: context.profileId, ...notDeleted() },
  })
  if (!note) throw new Error('NOT_FOUND')

  await prisma.candidateNote.update({
    where: { id: noteId },
    data: { deletedAt: new Date() },
  })

  await createAuditLog({
    actorId,
    action: 'candidate.note_delete',
    entityType: 'CandidateProfile',
    entityId: context.profileId,
    metadata: { noteId },
    ipAddress: auditContext.ipAddress,
  })
}

export async function getCandidateTimeline(userId) {
  const context = await getCandidateContext(userId)
  if (!context) return null

  const { profileId, applicationIds } = context

  const interviews = applicationIds.length
    ? await prisma.interview.findMany({
        where: { applicationId: { in: applicationIds }, ...notDeleted() },
        select: { id: true },
      })
    : []
  const interviewIds = interviews.map((item) => item.id)

  const preAdmissionCases = applicationIds.length
    ? await prisma.preAdmissionCase.findMany({
        where: { applicationId: { in: applicationIds }, ...notDeleted() },
        select: { id: true },
      })
    : []
  const preAdmissionCaseIds = preAdmissionCases.map((item) => item.id)

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entityType: 'CandidateProfile', entityId: profileId },
        { entityType: 'User', entityId: userId },
        ...(applicationIds.length
          ? [{ entityType: 'Application', entityId: { in: applicationIds } }]
          : []),
        ...(interviewIds.length
          ? [{ entityType: 'Interview', entityId: { in: interviewIds } }]
          : []),
        ...(preAdmissionCaseIds.length
          ? [{ entityType: 'PreAdmissionCase', entityId: { in: preAdmissionCaseIds } }]
          : []),
      ],
    },
    include: {
      actor: {
        include: {
          staffProfile: true,
          candidateProfile: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const notes = await prisma.candidateNote.findMany({
    where: { candidateId: profileId, ...notDeleted() },
    include: {
      author: {
        include: { staffProfile: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const events = [
    ...auditLogs.map(mapTimelineEvent),
    ...notes.map((note) => ({
      id: `note-${note.id}`,
      type: 'candidate.note',
      title: 'Nota da equipe',
      description: note.content,
      actor: mapActorName(note.author),
      createdAt: note.createdAt.toISOString(),
    })),
  ]

  return events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

async function getCandidateApplication(userId, applicationId) {
  const context = await getCandidateContext(userId)
  if (!context) throw new Error('NOT_FOUND')

  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      candidateId: context.profileId,
      ...notDeleted(),
    },
    include: {
      job: { select: { id: true, title: true, slug: true, status: true } },
    },
  })

  if (!application) throw new Error('APPLICATION_NOT_FOUND')
  return application
}

export async function reviewApplicationDocumentation(
  userId,
  applicationId,
  decision,
  reason,
  actorId,
  auditContext = {},
) {
  const application = await getCandidateApplication(userId, applicationId)

  if (application.currentStage !== DOCUMENTATION_STAGE) {
    throw new Error('INVALID_STAGE')
  }
  if (application.status === 'REJECTED') {
    throw new Error('ALREADY_REJECTED')
  }

  if (decision === 'approved') {
    const {
      approveAllDocumentationItems,
      assertDocumentationReadyForApproval,
      markDocumentationApproved,
    } = await import('./applicationDocumentation.service.js')

    await approveAllDocumentationItems(applicationId, actorId, auditContext)
    await assertDocumentationReadyForApproval(applicationId)
    await markDocumentationApproved(applicationId, actorId, auditContext)
    await moveApplicationStage(applicationId, APPROVED_STAGE, actorId, auditContext)

    const preCase = await prisma.preAdmissionCase.findFirst({
      where: { applicationId, ...notDeleted() },
    })
    if (preCase) {
      const { forwardPreAdmissionToDp } = await import('./preAdmission.service.js')
      await forwardPreAdmissionToDp(preCase.id, actorId, auditContext)
    }

    const { markForwardedToDp } = await import('./sla.service.js')
    await markForwardedToDp(applicationId)

    await createAuditLog({
      actorId,
      action: 'application.approve_documentation',
      entityType: 'Application',
      entityId: applicationId,
      metadata: {
        jobTitle: application.job.title,
        candidateProfileId: application.candidateId,
        forwardedToDp: Boolean(preCase),
      },
      ipAddress: auditContext.ipAddress,
    })
  } else if (decision === 'rejected') {
    const trimmedReason = String(reason || '').trim()
    if (!trimmedReason) throw new Error('VALIDATION')

    const { returnDocumentationToOrigin } = await import('./sla.service.js')
    await returnDocumentationToOrigin(applicationId, trimmedReason)

    await prisma.applicationDocumentation.updateMany({
      where: {
        applicationId,
        ...notDeleted(),
        status: { notIn: ['APPROVED'] },
      },
      data: {
        status: 'PENDING_UPLOAD',
        rejectionReason: trimmedReason,
        rejectedAt: new Date(),
        submittedForReviewAt: null,
      },
    })

    await createAuditLog({
      actorId,
      action: 'application.return_documentation',
      entityType: 'Application',
      entityId: applicationId,
      metadata: {
        reason: trimmedReason,
        jobTitle: application.job.title,
        stage: DOCUMENTATION_STAGE,
        candidateProfileId: application.candidateId,
      },
      ipAddress: auditContext.ipAddress,
    })
  } else {
    throw new Error('VALIDATION')
  }

  return getCandidateAdmin(userId)
}

export async function moveCandidateApplicationStage(
  userId,
  applicationId,
  stageSlug,
  actorId,
  auditContext = {},
) {
  await getCandidateApplication(userId, applicationId)

  const { moveApplicationStage } = await import('./pipeline.service.js')
  await moveApplicationStage(applicationId, stageSlug, actorId, auditContext)

  return getCandidateAdmin(userId)
}
