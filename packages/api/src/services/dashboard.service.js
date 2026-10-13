import { prisma, notDeleted } from '../lib/prisma.js'
import { countPendingPreAdmissionDocuments } from './preAdmission.service.js'
import { countDocumentationAwaitingReview } from './documentationNotifications.service.js'
import { getAuditActionLabel } from '../constants/auditLabels.js'

export async function getDashboardOverview() {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const [
    openJobs,
    hires,
    interviewsToday,
    talentPoolPending,
    candidatesCount,
    applicationsActive,
    preAdmissionMetrics,
    documentationUnderReview,
  ] = await Promise.all([
    prisma.job.count({ where: { status: 'PUBLISHED', ...notDeleted() } }),
    prisma.application.count({
      where: { currentStage: 'hired', ...notDeleted() },
    }),
    prisma.interview.count({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { gte: todayStart, lte: todayEnd },
        ...notDeleted(),
      },
    }),
    prisma.talentPoolEntry.count({ where: { status: 'PENDING', ...notDeleted() } }),
    prisma.candidateProfile.count({ where: notDeleted() }),
    prisma.application.count({
      where: {
        status: { notIn: ['REJECTED', 'WITHDRAWN'] },
        ...notDeleted(),
      },
    }),
    countPendingPreAdmissionDocuments(),
    countDocumentationAwaitingReview(),
  ])

  return {
    openJobs,
    hires,
    interviewsToday,
    pendingDocuments: preAdmissionMetrics.pendingDocuments,
    documentationUnderReview,
    admissions: preAdmissionMetrics.activeCases,
    awaitingDp: preAdmissionMetrics.awaitingDp,
    pendingTasks: talentPoolPending + applicationsActive,
    talentPoolPending,
    candidatesCount,
    applicationsActive,
  }
}

export async function getRecentActivities(limit = 12, since) {
  const where = since ? { createdAt: { gt: new Date(since) } } : {}

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      actor: {
        include: { staffProfile: true, candidateProfile: true },
      },
    },
  })

  return logs.map((log) => {
    const actorName =
      log.actor?.staffProfile?.name ||
      log.actor?.candidateProfile?.name ||
      'Sistema'

    return {
      id: log.id,
      action: log.action,
      label: getAuditActionLabel(log.action),
      entityType: log.entityType,
      entityId: log.entityId,
      actorName,
      createdAt: log.createdAt.toISOString(),
    }
  })
}
