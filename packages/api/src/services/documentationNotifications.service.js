import { prisma, notDeleted } from '../lib/prisma.js'
import { env } from '../config/env.js'
import {
  sendDocumentationItemRejectedEmail,
  sendDocumentationRequestEmail,
  sendDocumentationSubmittedToHrEmail,
} from './email.service.js'
import { createAuditLog } from './audit.service.js'
import { DOCUMENTATION_CANDIDATE_GUIDANCE } from '../constants/documentationGuidance.js'

async function getHrNotificationEmails() {
  if (env.hrNotifyEmail) {
    return env.hrNotifyEmail.split(',').map((email) => email.trim()).filter(Boolean)
  }

  const staffUsers = await prisma.user.findMany({
    where: {
      type: 'STAFF',
      status: 'ACTIVE',
      ...notDeleted(),
      staffProfile: { isNot: null },
    },
    select: {
      email: true,
      staffProfile: {
        select: {
          role: {
            select: {
              permissions: {
                select: {
                  permission: { select: { module: true, action: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  return staffUsers
    .filter((user) =>
      user.staffProfile?.role?.permissions?.some(
        (entry) =>
          `${entry.permission.module}:${entry.permission.action}` === 'candidates:read' ||
          `${entry.permission.module}:${entry.permission.action}` === 'candidates:write',
      ),
    )
    .map((user) => user.email)
}

function buildCandidateDocumentationUrl() {
  return `${env.appUrl}/portal-do-candidato/documentacao`
}

function buildAdminReviewUrl(candidateUserId) {
  return `${env.adminUrl}/candidatos/${candidateUserId}`
}

export async function notifyCandidateDocumentationRequested({
  applicationId,
  documentationId,
  actorId,
  auditContext = {},
}) {
  const record = await prisma.applicationDocumentation.findFirst({
    where: { id: documentationId, applicationId, ...notDeleted() },
    include: {
      application: {
        include: {
          candidate: { include: { user: { select: { id: true, email: true } } } },
          job: { select: { title: true } },
        },
      },
    },
  })
  if (!record) return

  const candidate = record.application?.candidate
  const email = candidate?.user?.email
  if (!email) return

  await sendDocumentationRequestEmail({
    name: candidate.name,
    email,
    jobTitle: record.application.job.title,
    portalUrl: buildCandidateDocumentationUrl(),
    guidance: DOCUMENTATION_CANDIDATE_GUIDANCE,
  })

  await prisma.applicationDocumentation.update({
    where: { id: documentationId },
    data: { candidateNotifiedAt: new Date() },
  })

  await createAuditLog({
    actorId,
    action: 'application.documentation_notify_candidate',
    entityType: 'ApplicationDocumentation',
    entityId: documentationId,
    metadata: {
      applicationId,
      candidateEmail: email,
      jobTitle: record.application.job.title,
    },
    ipAddress: auditContext.ipAddress,
  })
}

export async function notifyHrDocumentationSubmitted({
  documentationId,
  actorId,
  auditContext = {},
  resubmitted = false,
}) {
  const record = await prisma.applicationDocumentation.findFirst({
    where: { id: documentationId, ...notDeleted() },
    include: {
      application: {
        include: {
          candidate: { include: { user: { select: { id: true, email: true } } } },
          job: { select: { title: true } },
        },
      },
    },
  })
  if (!record) return

  const candidate = record.application.candidate
  const candidateUserId = candidate.user.id
  const reviewUrl = buildAdminReviewUrl(candidateUserId)
  const hrEmails = await getHrNotificationEmails()

  for (const hrEmail of hrEmails) {
    await sendDocumentationSubmittedToHrEmail({
      hrEmail,
      candidateName: candidate.name,
      jobTitle: record.application.job.title,
      reviewUrl,
      resubmitted,
    })
  }

  await prisma.applicationDocumentation.update({
    where: { id: documentationId },
    data: { hrNotifiedAt: new Date() },
  })

  await createAuditLog({
    actorId,
    action: resubmitted
      ? 'application.documentation_resubmitted'
      : 'application.documentation_submitted',
    entityType: 'ApplicationDocumentation',
    entityId: documentationId,
    metadata: {
      applicationId: record.applicationId,
      candidateName: candidate.name,
      jobTitle: record.application.job.title,
      notifiedHrCount: hrEmails.length,
    },
    ipAddress: auditContext.ipAddress,
  })
}

export async function notifyCandidateDocumentItemRejected({
  documentationId,
  itemLabel,
  reason,
  actorId,
  auditContext = {},
}) {
  const record = await prisma.applicationDocumentation.findFirst({
    where: { id: documentationId, ...notDeleted() },
    include: {
      application: {
        include: {
          candidate: { include: { user: { select: { email: true } } } },
          job: { select: { title: true } },
        },
      },
    },
  })
  if (!record) return

  const candidate = record.application.candidate
  const email = candidate.user?.email
  if (!email) return

  await sendDocumentationItemRejectedEmail({
    name: candidate.name,
    email,
    jobTitle: record.application.job.title,
    itemLabel,
    reason,
    portalUrl: buildCandidateDocumentationUrl(),
  })

  await createAuditLog({
    actorId,
    action: 'application.documentation_notify_rejection',
    entityType: 'ApplicationDocumentation',
    entityId: documentationId,
    metadata: { itemLabel, reason },
    ipAddress: auditContext.ipAddress,
  })
}

export async function listDocumentationReviewNotifications(limit = 15) {
  const records = await prisma.applicationDocumentation.findMany({
    where: {
      status: 'UNDER_REVIEW',
      ...notDeleted(),
    },
    include: {
      application: {
        include: {
          candidate: { include: { user: { select: { id: true } } } },
          job: { select: { title: true } },
        },
      },
    },
    orderBy: [{ submittedForReviewAt: 'desc' }, { updatedAt: 'desc' }],
    take: limit,
  })

  return records.map((record) => ({
    id: record.id,
    type: 'documentation_review',
    title: 'Documentação para validar',
    message: `${record.application.candidate.name} — ${record.application.job.title}`,
    linkPath: `/candidatos/${record.application.candidate.user.id}`,
    applicationId: record.applicationId,
    submittedForReviewAt: record.submittedForReviewAt?.toISOString() || record.updatedAt.toISOString(),
  }))
}

export async function countDocumentationAwaitingReview() {
  return prisma.applicationDocumentation.count({
    where: { status: 'UNDER_REVIEW', ...notDeleted() },
  })
}
