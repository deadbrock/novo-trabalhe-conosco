import { prisma, notDeleted } from '../lib/prisma.js'
import { createAuditLog } from './audit.service.js'
import { STAGE_STATUS_MAP } from '../constants/pipeline.js'
import { APPROVED_STAGE, INTERVIEW_STAGE } from '../utils/pipelineStages.js'
import { applicationScopeWhere } from '../utils/staffScope.js'
import { mapApplicationSla } from './sla.service.js'
import {
  countPipelineStages,
  findActivePipelineStageBySlug,
  findPipelineStages,
  seedDefaultPipelineStages,
  updatePipelineStageBySlug,
} from './pipelineStage.repository.js'

function mapStage(stage) {
  return {
    id: stage.id,
    slug: stage.slug,
    label: stage.label,
    color: stage.color,
    sortOrder: stage.sortOrder ?? stage.sort_order,
    isTerminal: stage.isTerminal ?? stage.is_terminal,
    isActive: stage.isActive ?? stage.is_active,
  }
}

function mapApplicationCard(app) {
  return {
    id: app.id,
    candidateId: app.candidateId,
    candidateName: app.candidate.name,
    candidateEmail: app.candidate.user.email,
    jobId: app.jobId,
    jobTitle: app.job.title,
    currentStage: app.currentStage,
    status: app.status,
    source: app.source,
    score: app.score,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
    ...mapApplicationSla(app),
  }
}

const applicationInclude = {
  candidate: {
    include: {
      user: { select: { email: true } },
    },
  },
  job: { select: { id: true, title: true, clientId: true, stateCode: true } },
  unit: true,
  slaClocks: true,
}

export async function ensurePipelineStages() {
  const count = await countPipelineStages()
  if (count > 0) return

  await seedDefaultPipelineStages()
}

export async function listPipelineStages() {
  await ensurePipelineStages()
  const stages = await findPipelineStages({ activeOnly: true })
  return stages.map(mapStage)
}

export async function listPipelineStagesForConfig() {
  await ensurePipelineStages()
  const stages = await findPipelineStages()
  return stages.map(mapStage)
}

export async function updatePipelineStages(stages, actorId, auditContext = {}) {
  await ensurePipelineStages()

  const existing = await findPipelineStages()
  const existingSlugs = new Set(existing.map((s) => s.slug))

  for (const stage of stages) {
    if (!existingSlugs.has(stage.slug)) {
      throw new Error('INVALID_STAGE')
    }

    await updatePipelineStageBySlug(stage.slug, {
      label: stage.label?.trim() || stage.slug,
      color: stage.color || 'slate',
      sortOrder: Number(stage.sortOrder),
      isActive: stage.isActive !== false,
    })
  }

  await createAuditLog({
    actorId,
    action: 'pipeline.stages_update',
    entityType: 'PipelineStageConfig',
    entityId: 'global',
    metadata: { count: stages.length },
    ipAddress: auditContext.ipAddress,
  })

  return listPipelineStagesForConfig()
}

function buildBoardWhere(filters = {}, actor = null) {
  const where = {
    ...notDeleted(),
    status: { notIn: ['REJECTED', 'WITHDRAWN'] },
    ...applicationScopeWhere(actor),
  }

  if (filters.jobId) where.jobId = filters.jobId

  if (filters.search?.trim()) {
    const term = filters.search.trim()
    where.OR = [
      { candidate: { name: { contains: term, mode: 'insensitive' } } },
      { candidate: { user: { email: { contains: term, mode: 'insensitive' } } } },
      { job: { title: { contains: term, mode: 'insensitive' } } },
    ]
  }

  return where
}

const BOARD_LIMIT_PER_STAGE = 60

export async function getPipelineBoard(filters = {}, actor = null) {
  const stages = await listPipelineStages()
  const where = buildBoardWhere(filters, actor)
  const limitPerStage = Number(filters.limitPerStage) || BOARD_LIMIT_PER_STAGE

  const [stageCounts, stageApplications] = await Promise.all([
    prisma.application.groupBy({
      by: ['currentStage'],
      where,
      _count: { _all: true },
    }),
    Promise.all(
      stages.map((stage) =>
        prisma.application.findMany({
          where: { ...where, currentStage: stage.slug },
          include: applicationInclude,
          orderBy: { updatedAt: 'desc' },
          take: limitPerStage,
        }),
      ),
    ),
  ])

  const countByStage = Object.fromEntries(
    stageCounts.map((row) => [row.currentStage, row._count._all]),
  )

  const stagesWithApps = stages.map((stage, index) => ({
    ...stage,
    applications: stageApplications[index].map(mapApplicationCard),
    totalCount: countByStage[stage.slug] || 0,
    truncated: (countByStage[stage.slug] || 0) > limitPerStage,
  }))

  const totalApplications = stageCounts.reduce((sum, row) => sum + row._count._all, 0)

  return {
    stages: stagesWithApps,
    totalApplications,
    limitPerStage,
  }
}

export async function moveApplicationStage(applicationId, stageSlug, actorId, auditContext = {}) {
  const stage = await findActivePipelineStageBySlug(stageSlug)
  if (!stage) throw new Error('INVALID_STAGE')

  const application = await prisma.application.findFirst({
    where: { id: applicationId, ...notDeleted() },
    include: applicationInclude,
  })
  if (!application) throw new Error('APPLICATION_NOT_FOUND')

  const fromStage = application.currentStage
  if (fromStage === stageSlug) {
    return mapApplicationCard(application)
  }

  const ownerUpdate =
    stageSlug === INTERVIEW_STAGE
      ? { currentOwner: 'HQ_HR' }
      : {}

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: {
      currentStage: stageSlug,
      status: STAGE_STATUS_MAP[stageSlug] || application.status,
      ...ownerUpdate,
    },
    include: applicationInclude,
  })

  await createAuditLog({
    actorId,
    action: 'pipeline.move',
    entityType: 'Application',
    entityId: applicationId,
    metadata: {
      fromStage,
      toStage: stageSlug,
      jobTitle: updated.job.title,
      candidateName: updated.candidate.name,
    },
    ipAddress: auditContext.ipAddress,
  })

  if (stageSlug === APPROVED_STAGE) {
    const { createPreAdmissionCaseForApplication } = await import('./preAdmission.service.js')
    await createPreAdmissionCaseForApplication(applicationId, actorId, auditContext)
  }

  return mapApplicationCard(updated)
}

export async function getApplicationDetail(applicationId) {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, ...notDeleted() },
    include: applicationInclude,
  })
  if (!application) return null
  return mapApplicationCard(application)
}
