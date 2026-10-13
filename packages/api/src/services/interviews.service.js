import { prisma, notDeleted, softDeleteData } from '../lib/prisma.js'
import { createAuditLog } from './audit.service.js'
import { moveApplicationStage } from './pipeline.service.js'
import { DOCUMENTATION_STAGE, INTERVIEW_STAGE } from '../utils/pipelineStages.js'

/** Etapa do pipeline: candidato aprovado na triagem e marcado para entrevista */
const INTERVIEW_PIPELINE_STAGE = INTERVIEW_STAGE

function interviewEligibleApplicationWhere() {
  return {
    ...notDeleted(),
    currentStage: INTERVIEW_PIPELINE_STAGE,
    status: { notIn: ['REJECTED', 'WITHDRAWN'] },
  }
}

function assertApplicationEligibleForInterview(application) {
  if (!application) throw new Error('APPLICATION_NOT_FOUND')
  if (application.currentStage !== INTERVIEW_PIPELINE_STAGE) {
    throw new Error('NOT_ELIGIBLE_FOR_INTERVIEW')
  }
}

const interviewInclude = {
  application: {
    include: {
      candidate: {
        include: {
          user: { select: { id: true, email: true } },
        },
      },
      job: { select: { id: true, title: true } },
    },
  },
  interviewer: {
    include: { staffProfile: true },
  },
  createdBy: {
    include: { staffProfile: true },
  },
}

function mapInterview(interview) {
  const app = interview.application
  return {
    id: interview.id,
    applicationId: interview.applicationId,
    candidateId: app?.candidate?.user?.id,
    candidateUserId: app?.candidate?.user?.id,
    candidateName: app?.candidate?.name || '',
    candidateEmail: app?.candidate?.user?.email || '',
    jobId: app?.jobId,
    jobTitle: app?.job?.title || '',
    interviewerId: interview.interviewerId,
    interviewerName: interview.interviewer?.staffProfile?.name || null,
    scheduledAt: interview.scheduledAt.toISOString(),
    durationMinutes: interview.durationMinutes,
    type: interview.type,
    location: interview.location,
    meetingLink: interview.meetingLink,
    status: interview.status,
    notes: interview.notes,
    score: interview.score,
    feedback: interview.feedback,
    sentToDocumentation: interview.sentToDocumentation,
    sentToDocumentationAt: interview.sentToDocumentationAt?.toISOString() || null,
    applicationCurrentStage: app?.currentStage || '',
    createdByName: interview.createdBy?.staffProfile?.name || null,
    createdAt: interview.createdAt.toISOString(),
    updatedAt: interview.updatedAt.toISOString(),
  }
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function buildDateRange(filters = {}) {
  const now = new Date()
  if (filters.period === 'today') {
    return { gte: startOfDay(now), lte: endOfDay(now) }
  }
  if (filters.period === 'week') {
    const start = startOfDay(now)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    end.setHours(23, 59, 59, 999)
    return { gte: start, lte: end }
  }
  if (filters.from || filters.to) {
    const range = {}
    if (filters.from) range.gte = new Date(filters.from)
    if (filters.to) range.lte = endOfDay(new Date(filters.to))
    return range
  }
  return undefined
}

export async function getInterviewStats() {
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const weekEnd = new Date(todayStart)
  weekEnd.setDate(weekEnd.getDate() + 7)
  weekEnd.setHours(23, 59, 59, 999)

  const base = { ...notDeleted() }
  const eligibleWhere = interviewEligibleApplicationWhere()

  const [today, thisWeek, scheduled, completed, waitingForSchedule] = await Promise.all([
    prisma.interview.count({
      where: {
        ...base,
        status: 'SCHEDULED',
        scheduledAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.interview.count({
      where: {
        ...base,
        status: 'SCHEDULED',
        scheduledAt: { gte: todayStart, lte: weekEnd },
      },
    }),
    prisma.interview.count({ where: { ...base, status: 'SCHEDULED' } }),
    prisma.interview.count({ where: { ...base, status: 'COMPLETED' } }),
    prisma.application.count({
      where: {
        ...eligibleWhere,
        interviews: {
          none: {
            ...notDeleted(),
            status: 'SCHEDULED',
          },
        },
      },
    }),
  ])

  return { today, thisWeek, scheduled, completed, waitingForSchedule }
}

export async function listInterviewsAdmin(filters = {}) {
  const scheduledAt = buildDateRange(filters)

  const where = {
    ...notDeleted(),
    ...(filters.status ? { status: filters.status } : {}),
    ...(scheduledAt ? { scheduledAt } : {}),
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

  const interviews = await prisma.interview.findMany({
    where,
    include: interviewInclude,
    orderBy: { scheduledAt: 'asc' },
  })

  return interviews.map(mapInterview)
}

export async function getInterviewAdmin(id) {
  const interview = await prisma.interview.findFirst({
    where: { id, ...notDeleted() },
    include: interviewInclude,
  })
  if (!interview) return null
  return mapInterview(interview)
}

export async function listInterviewCandidateOptions() {
  const applications = await prisma.application.findMany({
    where: interviewEligibleApplicationWhere(),
    select: {
      id: true,
      currentStage: true,
      status: true,
      updatedAt: true,
      candidate: {
        select: {
          name: true,
          user: { select: { id: true, email: true } },
        },
      },
      job: { select: { id: true, title: true } },
      interviews: {
        where: { ...notDeleted(), status: 'SCHEDULED' },
        select: { id: true },
        take: 1,
      },
    },
    orderBy: [{ updatedAt: 'desc' }, { candidate: { name: 'asc' } }],
  })

  return applications.map((app) => ({
    applicationId: app.id,
    candidateUserId: app.candidate.user.id,
    candidateName: app.candidate.name,
    candidateEmail: app.candidate.user.email,
    jobId: app.job.id,
    jobTitle: app.job.title,
    currentStage: app.currentStage,
    status: app.status,
    hasScheduledInterview: app.interviews.length > 0,
    updatedAt: app.updatedAt.toISOString(),
  }))
}

/** @deprecated Use listInterviewCandidateOptions */
export async function listInterviewApplicationOptions() {
  return listInterviewCandidateOptions()
}

export async function createInterviewAdmin(data, actorId, auditContext = {}) {
  if (!data.applicationId) throw new Error('VALIDATION')
  if (!data.scheduledAt) throw new Error('VALIDATION')

  const application = await prisma.application.findFirst({
    where: { id: data.applicationId, ...notDeleted() },
  })
  assertApplicationEligibleForInterview(application)

  const scheduledAt = new Date(data.scheduledAt)
  if (Number.isNaN(scheduledAt.getTime())) throw new Error('INVALID_DATE')

  const interview = await prisma.interview.create({
    data: {
      applicationId: data.applicationId,
      interviewerId: data.interviewerId || actorId,
      scheduledAt,
      durationMinutes: Number(data.durationMinutes) || 60,
      type: data.type || 'VIDEO',
      location: data.location?.trim() || '',
      meetingLink: data.meetingLink?.trim() || '',
      status: 'SCHEDULED',
      notes: data.notes?.trim() || '',
      createdById: actorId,
    },
    include: interviewInclude,
  })

  await createAuditLog({
    actorId,
    action: 'interview.create',
    entityType: 'Interview',
    entityId: interview.id,
    metadata: {
      applicationId: interview.applicationId,
      scheduledAt: interview.scheduledAt.toISOString(),
    },
    ipAddress: auditContext.ipAddress,
  })

  return mapInterview(interview)
}

export async function updateInterviewAdmin(id, data, actorId, auditContext = {}) {
  const existing = await prisma.interview.findFirst({
    where: { id, ...notDeleted() },
  })
  if (!existing) throw new Error('NOT_FOUND')

  const updateData = {}

  if (data.scheduledAt !== undefined) {
    const scheduledAt = new Date(data.scheduledAt)
    if (Number.isNaN(scheduledAt.getTime())) throw new Error('INVALID_DATE')
    updateData.scheduledAt = scheduledAt
  }
  if (data.durationMinutes !== undefined) updateData.durationMinutes = Number(data.durationMinutes) || 60
  if (data.type !== undefined) updateData.type = data.type
  if (data.location !== undefined) updateData.location = data.location.trim()
  if (data.meetingLink !== undefined) updateData.meetingLink = data.meetingLink.trim()
  if (data.status !== undefined) updateData.status = data.status
  if (data.notes !== undefined) updateData.notes = data.notes.trim()
  if (data.score !== undefined) updateData.score = data.score === '' || data.score == null ? null : Number(data.score)
  if (data.feedback !== undefined) updateData.feedback = data.feedback.trim()
  if (data.interviewerId !== undefined) updateData.interviewerId = data.interviewerId || null

  const interview = await prisma.interview.update({
    where: { id },
    data: updateData,
    include: interviewInclude,
  })

  await createAuditLog({
    actorId,
    action: 'interview.update',
    entityType: 'Interview',
    entityId: interview.id,
    metadata: { status: interview.status },
    ipAddress: auditContext.ipAddress,
  })

  return mapInterview(interview)
}

export async function deleteInterviewAdmin(id, actorId, auditContext = {}) {
  const existing = await prisma.interview.findFirst({
    where: { id, ...notDeleted() },
  })
  if (!existing) throw new Error('NOT_FOUND')

  await prisma.interview.update({
    where: { id },
    data: softDeleteData(),
  })

  await createAuditLog({
    actorId,
    action: 'interview.delete',
    entityType: 'Interview',
    entityId: id,
    ipAddress: auditContext.ipAddress,
  })
}

export async function sendInterviewToDocumentation(interviewId, actorId, auditContext = {}) {
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, ...notDeleted() },
    include: interviewInclude,
  })
  if (!interview) throw new Error('NOT_FOUND')
  if (interview.sentToDocumentation) throw new Error('ALREADY_SENT')

  const application = interview.application
  if (!application || application.currentStage !== INTERVIEW_PIPELINE_STAGE) {
    throw new Error('INVALID_STAGE')
  }

  const now = new Date()

  await prisma.interview.update({
    where: { id: interviewId },
    data: {
      status: 'COMPLETED',
      sentToDocumentation: true,
      sentToDocumentationAt: now,
    },
  })

  const { markInterviewApproved } = await import('./sla.service.js')
  await markInterviewApproved(interview.applicationId)

  await moveApplicationStage(interview.applicationId, DOCUMENTATION_STAGE, actorId, auditContext)

  const { ensureApplicationDocumentation } = await import('./applicationDocumentation.service.js')
  const documentation = await ensureApplicationDocumentation(interview.applicationId, actorId, auditContext)

  const { notifyCandidateDocumentationRequested } = await import('./documentationNotifications.service.js')
  if (!documentation.candidateNotifiedAt) {
    await notifyCandidateDocumentationRequested({
      applicationId: interview.applicationId,
      documentationId: documentation.id,
      actorId,
      auditContext,
    })
  }

  await createAuditLog({
    actorId,
    action: 'interview.send_to_documentation',
    entityType: 'Interview',
    entityId: interviewId,
    metadata: {
      applicationId: interview.applicationId,
      candidateName: application.candidate.name,
      jobTitle: application.job.title,
    },
    ipAddress: auditContext.ipAddress,
  })

  const updated = await prisma.interview.findFirst({
    where: { id: interviewId },
    include: interviewInclude,
  })

  return mapInterview(updated)
}
