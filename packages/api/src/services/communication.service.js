import { prisma, notDeleted, softDeleteData } from '../lib/prisma.js'
import { createAuditLog } from './audit.service.js'
import { sendCustomEmail } from './email.service.js'
import { renderTemplate, buildCandidateVariables } from '../utils/templateVars.js'
import { company } from '../templates/company.js'

function mapTemplate(template) {
  return {
    id: template.id,
    name: template.name,
    channel: template.channel,
    subject: template.subject,
    body: template.body,
    isActive: template.isActive,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  }
}

function mapLog(log) {
  return {
    id: log.id,
    templateId: log.templateId,
    templateName: log.template?.name || null,
    applicationId: log.applicationId,
    candidateId: log.candidateId,
    candidateName: log.candidate?.name || log.application?.candidate?.name || null,
    jobTitle: log.application?.job?.title || null,
    channel: log.channel,
    recipient: log.recipient,
    subject: log.subject,
    body: log.body,
    status: log.status,
    sentAt: log.sentAt?.toISOString() || null,
    sentByName: log.sentBy?.staffProfile?.name || null,
    errorMessage: log.errorMessage,
    createdAt: log.createdAt.toISOString(),
  }
}

const logInclude = {
  template: true,
  candidate: true,
  application: {
    include: {
      candidate: true,
      job: { select: { title: true } },
    },
  },
  sentBy: { include: { staffProfile: true } },
}

export async function getCommunicationStats() {
  const base = { ...notDeleted() }
  const [templates, sent, failed, whatsapp] = await Promise.all([
    prisma.messageTemplate.count({ where: { ...base, isActive: true } }),
    prisma.communicationLog.count({ where: { ...base, status: 'SENT' } }),
    prisma.communicationLog.count({ where: { ...base, status: 'FAILED' } }),
    prisma.communicationLog.count({ where: { ...base, channel: 'WHATSAPP', status: 'SENT' } }),
  ])

  return { templates, sent, failed, whatsapp }
}

export async function listMessageTemplates() {
  const templates = await prisma.messageTemplate.findMany({
    where: notDeleted(),
    orderBy: { name: 'asc' },
  })
  return templates.map(mapTemplate)
}

export async function createMessageTemplate(data, actorId, auditContext = {}) {
  if (!data.name?.trim() || !data.body?.trim()) throw new Error('VALIDATION')
  if (!data.channel) throw new Error('VALIDATION')

  const template = await prisma.messageTemplate.create({
    data: {
      name: data.name.trim(),
      channel: data.channel,
      subject: data.subject?.trim() || '',
      body: data.body.trim(),
      isActive: data.isActive !== false,
    },
  })

  await createAuditLog({
    actorId,
    action: 'communication.template_create',
    entityType: 'MessageTemplate',
    entityId: template.id,
    ipAddress: auditContext.ipAddress,
  })

  return mapTemplate(template)
}

export async function updateMessageTemplate(id, data, actorId, auditContext = {}) {
  const existing = await prisma.messageTemplate.findFirst({
    where: { id, ...notDeleted() },
  })
  if (!existing) throw new Error('NOT_FOUND')

  const template = await prisma.messageTemplate.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.channel !== undefined ? { channel: data.channel } : {}),
      ...(data.subject !== undefined ? { subject: data.subject.trim() } : {}),
      ...(data.body !== undefined ? { body: data.body.trim() } : {}),
      ...(data.isActive !== undefined ? { isActive: Boolean(data.isActive) } : {}),
    },
  })

  await createAuditLog({
    actorId,
    action: 'communication.template_update',
    entityType: 'MessageTemplate',
    entityId: template.id,
    ipAddress: auditContext.ipAddress,
  })

  return mapTemplate(template)
}

export async function deleteMessageTemplate(id, actorId, auditContext = {}) {
  const existing = await prisma.messageTemplate.findFirst({
    where: { id, ...notDeleted() },
  })
  if (!existing) throw new Error('NOT_FOUND')

  await prisma.messageTemplate.update({
    where: { id },
    data: softDeleteData(),
  })

  await createAuditLog({
    actorId,
    action: 'communication.template_delete',
    entityType: 'MessageTemplate',
    entityId: id,
    ipAddress: auditContext.ipAddress,
  })
}

export async function listCommunicationLogs(filters = {}) {
  const where = { ...notDeleted() }
  if (filters.channel) where.channel = filters.channel
  if (filters.status) where.status = filters.status

  const logs = await prisma.communicationLog.findMany({
    where,
    include: logInclude,
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return logs.map(mapLog)
}

async function resolveRecipientContext({ applicationId, candidateUserId }) {
  if (applicationId) {
    const application = await prisma.application.findFirst({
      where: { id: applicationId, ...notDeleted() },
      include: {
        candidate: { include: { user: true } },
        job: { select: { title: true } },
      },
    })
    if (!application) throw new Error('APPLICATION_NOT_FOUND')
    return {
      applicationId: application.id,
      candidateId: application.candidateId,
      candidateName: application.candidate.name,
      candidateEmail: application.candidate.user.email,
      jobTitle: application.job.title,
    }
  }

  if (candidateUserId) {
    const user = await prisma.user.findFirst({
      where: { id: candidateUserId, type: 'CANDIDATE', ...notDeleted() },
      include: { candidateProfile: true },
    })
    if (!user?.candidateProfile) throw new Error('CANDIDATE_NOT_FOUND')
    return {
      applicationId: null,
      candidateId: user.candidateProfile.id,
      candidateName: user.candidateProfile.name,
      candidateEmail: user.email,
      jobTitle: '',
    }
  }

  throw new Error('VALIDATION')
}

export async function sendCommunication(data, actorId, auditContext = {}) {
  let channel = data.channel
  if (!channel && data.templateId) {
    const tpl = await prisma.messageTemplate.findFirst({
      where: { id: data.templateId, ...notDeleted() },
    })
    channel = tpl?.channel
  }
  if (!channel) throw new Error('VALIDATION')

  let subject = data.subject?.trim() || ''
  let body = data.body?.trim() || ''
  let templateId = data.templateId || null

  const context = await resolveRecipientContext({
    applicationId: data.applicationId,
    candidateUserId: data.candidateUserId,
  })

  if (templateId) {
    const template = await prisma.messageTemplate.findFirst({
      where: { id: templateId, ...notDeleted(), isActive: true },
    })
    if (!template) throw new Error('TEMPLATE_NOT_FOUND')
    if (!body) body = template.body
    if (!subject && template.channel === 'EMAIL') subject = template.subject
  }

  if (!body) throw new Error('VALIDATION')

  const variables = buildCandidateVariables({
    candidateName: context.candidateName,
    candidateEmail: context.candidateEmail,
    jobTitle: context.jobTitle,
    companyName: company.name,
    interviewDate: data.interviewDate || '',
    meetingLink: data.meetingLink || '',
  })

  const renderedBody = renderTemplate(body, variables)
  const renderedSubject = renderTemplate(subject, variables)

  const recipient =
    channel === 'EMAIL'
      ? context.candidateEmail
      : data.recipient?.trim() || context.candidateEmail

  if (!recipient) throw new Error('VALIDATION')

  const log = await prisma.communicationLog.create({
    data: {
      templateId,
      applicationId: context.applicationId,
      candidateId: context.candidateId,
      channel,
      recipient,
      subject: renderedSubject,
      body: renderedBody,
      status: 'DRAFT',
      sentById: actorId,
    },
  })

  try {
    if (channel === 'EMAIL') {
      await sendCustomEmail({
        to: recipient,
        subject: renderedSubject || `Mensagem — ${company.name}`,
        bodyHtml: renderedBody.replace(/\n/g, '<br>'),
      })

      const updated = await prisma.communicationLog.update({
        where: { id: log.id },
        data: { status: 'SENT', sentAt: new Date() },
        include: logInclude,
      })

      await createAuditLog({
        actorId,
        action: 'communication.send',
        entityType: 'CommunicationLog',
        entityId: log.id,
        metadata: { channel, recipient },
        ipAddress: auditContext.ipAddress,
      })

      return mapLog(updated)
    }

    // WhatsApp: registra como enviado para copiar manualmente (integração futura)
    const updated = await prisma.communicationLog.update({
      where: { id: log.id },
      data: { status: 'SENT', sentAt: new Date() },
      include: logInclude,
    })

    await createAuditLog({
      actorId,
      action: 'communication.send',
      entityType: 'CommunicationLog',
      entityId: log.id,
      metadata: { channel: 'WHATSAPP', recipient },
      ipAddress: auditContext.ipAddress,
    })

    return mapLog(updated)
  } catch (error) {
    await prisma.communicationLog.update({
      where: { id: log.id },
      data: {
        status: 'FAILED',
        errorMessage: error.message || 'Erro ao enviar comunicação.',
      },
    })
    throw error
  }
}

export async function previewCommunication(data) {
  const context = await resolveRecipientContext({
    applicationId: data.applicationId,
    candidateUserId: data.candidateUserId,
  })

  let subject = data.subject?.trim() || ''
  let body = data.body?.trim() || ''

  if (data.templateId) {
    const template = await prisma.messageTemplate.findFirst({
      where: { id: data.templateId, ...notDeleted() },
    })
    if (!template) throw new Error('TEMPLATE_NOT_FOUND')
    if (!body) body = template.body
    if (!subject) subject = template.subject
  }

  const variables = buildCandidateVariables({
    candidateName: context.candidateName,
    candidateEmail: context.candidateEmail,
    jobTitle: context.jobTitle,
    companyName: company.name,
    interviewDate: data.interviewDate || '',
    meetingLink: data.meetingLink || '',
  })

  return {
    recipient: context.candidateEmail,
    subject: renderTemplate(subject, variables),
    body: renderTemplate(body, variables),
    candidateName: context.candidateName,
    jobTitle: context.jobTitle,
  }
}
