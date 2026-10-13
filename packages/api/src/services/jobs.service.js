import { prisma, notDeleted, softDeleteData } from '../lib/prisma.js'
import { createAuditLog } from './audit.service.js'
import { jobInclude, mapJobAdmin, mapJobPublic, uniqueJobSlug } from '../utils/jobMapper.js'
import { jobScopeWhere } from '../utils/staffScope.js'
import { resolveUnitIdForJob } from './operationalUnit.service.js'

function buildJobWhere(filters = {}, actor = null) {
  const where = { ...notDeleted(), ...jobScopeWhere(actor) }

  if (filters.status && filters.status !== 'undefined') where.status = filters.status
  if (filters.clientId && filters.clientId !== 'undefined') where.clientId = filters.clientId
  if (filters.stateCode && filters.stateCode !== 'undefined') where.stateCode = filters.stateCode
  if (filters.search && filters.search !== 'undefined') {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { area: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  return where
}

export async function listJobsAdmin(filters = {}, actor = null) {
  const jobs = await prisma.job.findMany({
    where: buildJobWhere(filters, actor),
    include: jobInclude,
    orderBy: { updatedAt: 'desc' },
  })
  return jobs.map(mapJobAdmin)
}

export async function getJobAdmin(id) {
  const job = await prisma.job.findFirst({
    where: { id, ...notDeleted() },
    include: jobInclude,
  })
  if (!job) return null
  return mapJobAdmin(job)
}

export async function createJob(data, actorId, auditContext = {}) {
  const slug = await uniqueJobSlug(prisma, data.title)

  const job = await prisma.job.create({
    data: {
      title: data.title.trim(),
      slug,
      description: data.description || '',
      requirements: data.requirements || '',
      benefits: data.benefits || '',
      area: data.area || '',
      locationLabel: data.locationLabel || '',
      workModality: data.workModality || 'Presencial',
      employmentType: data.employmentType || 'CLT',
      level: data.level || '',
      featured: Boolean(data.featured),
      clientId: data.clientId || null,
      contractId: data.contractId || null,
      departmentId: data.departmentId || null,
      cityId: data.cityId || null,
      stateCode: data.stateCode || '',
      workSchedule: data.workSchedule || '',
      urgency: data.urgency || 'MEDIUM',
      quantity: Number(data.quantity) || 1,
      salaryRange: data.salaryRange || '',
      status: 'DRAFT',
      createdById: actorId,
      unitId: await resolveUnitIdForJob({
        unitId: data.unitId,
        stateCode: data.stateCode,
        actor: data.actor,
      }),
    },
    include: jobInclude,
  })

  await createAuditLog({
    actorId,
    action: 'job.create',
    entityType: 'Job',
    entityId: job.id,
    ipAddress: auditContext.ipAddress,
  })

  return mapJobAdmin(job)
}

export async function updateJob(id, data, actorId, auditContext = {}) {
  const existing = await prisma.job.findFirst({ where: { id, ...notDeleted() } })
  if (!existing) throw new Error('JOB_NOT_FOUND')

  const slug = data.title && data.title !== existing.title
    ? await uniqueJobSlug(prisma, data.title, id)
    : existing.slug

  const job = await prisma.job.update({
    where: { id },
    data: {
      title: data.title?.trim() ?? existing.title,
      slug,
      description: data.description ?? existing.description,
      requirements: data.requirements ?? existing.requirements,
      benefits: data.benefits ?? existing.benefits,
      area: data.area ?? existing.area,
      locationLabel: data.locationLabel ?? existing.locationLabel,
      workModality: data.workModality ?? existing.workModality,
      employmentType: data.employmentType ?? existing.employmentType,
      level: data.level ?? existing.level,
      featured: data.featured !== undefined ? Boolean(data.featured) : existing.featured,
      clientId: data.clientId !== undefined ? data.clientId || null : existing.clientId,
      contractId: data.contractId !== undefined ? data.contractId || null : existing.contractId,
      departmentId: data.departmentId !== undefined ? data.departmentId || null : existing.departmentId,
      cityId: data.cityId !== undefined ? data.cityId || null : existing.cityId,
      stateCode: data.stateCode ?? existing.stateCode,
      unitId:
        data.unitId !== undefined
          ? data.unitId || null
          : await resolveUnitIdForJob({
              unitId: existing.unitId,
              stateCode: data.stateCode ?? existing.stateCode,
              actor: data.actor,
            }),
      workSchedule: data.workSchedule ?? existing.workSchedule,
      urgency: data.urgency ?? existing.urgency,
      quantity: data.quantity !== undefined ? Number(data.quantity) : existing.quantity,
      salaryRange: data.salaryRange ?? existing.salaryRange,
    },
    include: jobInclude,
  })

  await createAuditLog({
    actorId,
    action: 'job.update',
    entityType: 'Job',
    entityId: job.id,
    ipAddress: auditContext.ipAddress,
  })

  return mapJobAdmin(job)
}

export async function deleteJob(id, actorId, auditContext = {}) {
  const existing = await prisma.job.findFirst({ where: { id, ...notDeleted() } })
  if (!existing) throw new Error('JOB_NOT_FOUND')

  await prisma.job.update({ where: { id }, data: softDeleteData() })

  await createAuditLog({
    actorId,
    action: 'job.delete',
    entityType: 'Job',
    entityId: id,
    ipAddress: auditContext.ipAddress,
  })
}

export async function publishJob(id, actorId, auditContext = {}) {
  const existing = await prisma.job.findFirst({ where: { id, ...notDeleted() } })
  if (!existing) throw new Error('JOB_NOT_FOUND')

  const job = await prisma.job.update({
    where: { id },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
    include: jobInclude,
  })

  await createAuditLog({
    actorId,
    action: 'job.publish',
    entityType: 'Job',
    entityId: id,
    ipAddress: auditContext.ipAddress,
  })

  return mapJobAdmin(job)
}

export async function unpublishJob(id, actorId, auditContext = {}) {
  const existing = await prisma.job.findFirst({ where: { id, ...notDeleted() } })
  if (!existing) throw new Error('JOB_NOT_FOUND')

  const job = await prisma.job.update({
    where: { id },
    data: { status: 'PAUSED' },
    include: jobInclude,
  })

  await createAuditLog({
    actorId,
    action: 'job.unpublish',
    entityType: 'Job',
    entityId: id,
    ipAddress: auditContext.ipAddress,
  })

  return mapJobAdmin(job)
}

export async function listPublicJobs() {
  const jobs = await prisma.job.findMany({
    where: { status: 'PUBLISHED', ...notDeleted() },
    include: jobInclude,
    orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
  })
  return jobs.map(mapJobPublic)
}

export async function getPublicJobBySlug(slug) {
  const job = await prisma.job.findFirst({
    where: { slug, status: 'PUBLISHED', ...notDeleted() },
    include: jobInclude,
  })
  if (!job) return null
  return mapJobPublic(job)
}

export async function applyToJob({ jobId, candidateUserId }, auditContext = {}) {
  const job = await prisma.job.findFirst({
    where: { id: jobId, status: 'PUBLISHED', ...notDeleted() },
  })
  if (!job) throw new Error('JOB_NOT_FOUND')

  const profile = await prisma.candidateProfile.findFirst({
    where: { userId: candidateUserId, ...notDeleted() },
  })
  if (!profile) throw new Error('CANDIDATE_NOT_FOUND')

  const existing = await prisma.application.findFirst({
    where: { jobId, candidateId: profile.id, ...notDeleted() },
  })
  if (existing) throw new Error('ALREADY_APPLIED')

  const application = await prisma.application.create({
    data: {
      candidateId: profile.id,
      jobId,
      status: 'PENDING',
      source: 'website',
      currentStage: 'new',
      currentOwner: 'LOCAL',
      unitId: job.unitId,
    },
    include: { job: true },
  })

  await createAuditLog({
    actorId: candidateUserId,
    action: 'application.create',
    entityType: 'Application',
    entityId: application.id,
    metadata: { jobId, jobTitle: job.title },
    ipAddress: auditContext.ipAddress,
  })

  return {
    id: application.id,
    jobId: application.jobId,
    jobTitle: application.job.title,
    status: application.status.toLowerCase(),
    createdAt: application.createdAt.toISOString(),
  }
}
