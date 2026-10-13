import { prisma, notDeleted } from '../lib/prisma.js'
import { DEFAULT_PIPELINE_STAGES } from '../constants/pipeline.js'

const PERIOD_DAYS = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

export function parseAnalyticsPeriod({ period = '30d', from, to } = {}) {
  const now = new Date()
  const toDate = to ? new Date(to) : now
  toDate.setHours(23, 59, 59, 999)

  if (from) {
    const fromDate = new Date(from)
    fromDate.setHours(0, 0, 0, 0)
    return { fromDate, toDate, period: 'custom' }
  }

  if (period === 'all') {
    return { fromDate: null, toDate, period }
  }

  const days = PERIOD_DAYS[period] || 30
  const fromDate = new Date(now)
  fromDate.setDate(fromDate.getDate() - days)
  fromDate.setHours(0, 0, 0, 0)

  return { fromDate, toDate, period }
}

function applicationDateFilter(fromDate, toDate) {
  if (!fromDate) return { ...notDeleted() }
  return {
    ...notDeleted(),
    createdAt: { gte: fromDate, lte: toDate },
  }
}

async function loadPipelineStages() {
  const configured = await prisma.pipelineStageConfig.findMany({
    where: { ...notDeleted(), isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  if (configured.length) {
    return configured.map((stage) => ({
      slug: stage.slug,
      label: stage.label,
      sortOrder: stage.sortOrder,
      isTerminal: stage.isTerminal,
    }))
  }

  return DEFAULT_PIPELINE_STAGES
}

export async function getAnalyticsOverview(filters = {}) {
  const { fromDate, toDate, period } = parseAnalyticsPeriod(filters)
  const dateWhere = applicationDateFilter(fromDate, toDate)

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const [
    applicationsInPeriod,
    hiresInPeriod,
    rejectedInPeriod,
    interviewsInPeriod,
    interviewsToday,
    openJobs,
    talentPoolPending,
    candidatesInPeriod,
    communicationsSent,
  ] = await Promise.all([
    prisma.application.count({ where: dateWhere }),
    prisma.application.count({
      where: {
        ...dateWhere,
        currentStage: 'hired',
      },
    }),
    prisma.application.count({
      where: {
        ...notDeleted(),
        status: 'REJECTED',
        ...(fromDate ? { rejectedAt: { gte: fromDate, lte: toDate } } : {}),
      },
    }),
    prisma.interview.count({
      where: {
        ...notDeleted(),
        ...(fromDate ? { scheduledAt: { gte: fromDate, lte: toDate } } : {}),
      },
    }),
    prisma.interview.count({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { gte: todayStart, lte: todayEnd },
        ...notDeleted(),
      },
    }),
    prisma.job.count({ where: { status: 'PUBLISHED', ...notDeleted() } }),
    prisma.talentPoolEntry.count({ where: { status: 'PENDING', ...notDeleted() } }),
    fromDate
      ? prisma.candidateProfile.count({
          where: { ...notDeleted(), createdAt: { gte: fromDate, lte: toDate } },
        })
      : prisma.candidateProfile.count({ where: notDeleted() }),
    prisma.communicationLog.count({
      where: {
        ...notDeleted(),
        status: 'SENT',
        ...(fromDate ? { sentAt: { gte: fromDate, lte: toDate } } : {}),
      },
    }),
  ])

  const conversionRate =
    applicationsInPeriod > 0
      ? Math.round((hiresInPeriod / applicationsInPeriod) * 1000) / 10
      : 0

  return {
    period,
    from: fromDate?.toISOString() || null,
    to: toDate.toISOString(),
    applicationsInPeriod,
    hiresInPeriod,
    rejectedInPeriod,
    interviewsInPeriod,
    interviewsToday,
    openJobs,
    talentPoolPending,
    candidatesInPeriod,
    communicationsSent,
    conversionRate,
  }
}

export async function getConversionFunnel(filters = {}) {
  const { fromDate, toDate, period } = parseAnalyticsPeriod(filters)
  const stages = await loadPipelineStages()

  const where = {
    ...notDeleted(),
    status: { notIn: ['REJECTED', 'WITHDRAWN'] },
    ...(fromDate ? { createdAt: { gte: fromDate, lte: toDate } } : {}),
  }

  const grouped = await prisma.application.groupBy({
    by: ['currentStage'],
    where,
    _count: { _all: true },
  })

  const countByStage = Object.fromEntries(grouped.map((row) => [row.currentStage, row._count._all]))
  const total = grouped.reduce((sum, row) => sum + row._count._all, 0)

  const steps = stages.map((stage) => {
    const count = countByStage[stage.slug] || 0
    return {
      slug: stage.slug,
      label: stage.label,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      sortOrder: stage.sortOrder,
    }
  })

  return { period, from: fromDate?.toISOString() || null, to: toDate.toISOString(), total, steps }
}

export async function getApplicationsByState(filters = {}) {
  const { fromDate, toDate, period } = parseAnalyticsPeriod(filters)

  const applications = await prisma.application.findMany({
    where: applicationDateFilter(fromDate, toDate),
    select: {
      currentStage: true,
      candidate: { select: { state: true } },
    },
  })

  const stateMap = new Map()

  for (const app of applications) {
    const state = (app.candidate?.state || 'ND').toUpperCase().trim() || 'ND'
    if (!stateMap.has(state)) {
      stateMap.set(state, { state, applications: 0, hires: 0 })
    }
    const entry = stateMap.get(state)
    entry.applications += 1
    if (app.currentStage === 'hired') entry.hires += 1
  }

  const states = [...stateMap.values()].sort((a, b) => b.applications - a.applications)

  return { period, from: fromDate?.toISOString() || null, to: toDate.toISOString(), states }
}

export async function getStageDurationStats(filters = {}) {
  const { fromDate, toDate, period } = parseAnalyticsPeriod(filters)
  const stages = await loadPipelineStages()
  const stageSlugs = new Set(stages.map((s) => s.slug))

  const logs = await prisma.auditLog.findMany({
    where: {
      action: 'pipeline.move',
      ...(fromDate ? { createdAt: { gte: fromDate, lte: toDate } } : {}),
    },
    orderBy: { createdAt: 'asc' },
    select: {
      entityId: true,
      createdAt: true,
      metadata: true,
    },
  })

  const durationsByStage = new Map()
  const appStageTimes = new Map()

  for (const log of logs) {
    const fromStage = log.metadata?.fromStage
    const appId = log.entityId
    if (!fromStage || !stageSlugs.has(fromStage)) continue

    const history = appStageTimes.get(appId) || {}
    const enteredAt = history[fromStage]
    if (enteredAt) {
      const hours = (log.createdAt.getTime() - enteredAt.getTime()) / 3_600_000
      if (hours >= 0) {
        if (!durationsByStage.has(fromStage)) durationsByStage.set(fromStage, [])
        durationsByStage.get(fromStage).push(hours)
      }
    }

    const toStage = log.metadata?.toStage
    if (toStage) {
      const next = { ...history, [toStage]: log.createdAt }
      appStageTimes.set(appId, next)
    }
  }

  const items = stages
    .filter((stage) => !stage.isTerminal)
    .map((stage) => {
      const samples = durationsByStage.get(stage.slug) || []
      const averageHours =
        samples.length > 0
          ? Math.round((samples.reduce((a, b) => a + b, 0) / samples.length) * 10) / 10
          : 0

      return {
        slug: stage.slug,
        label: stage.label,
        averageHours,
        averageDays: Math.round((averageHours / 24) * 10) / 10,
        sampleSize: samples.length,
        sortOrder: stage.sortOrder,
      }
    })
    .filter((item) => item.sampleSize > 0)

  const { getSlaCycleStats } = await import('./sla.service.js')
  const slaCycles = await getSlaCycleStats()

  return {
    period,
    from: fromDate?.toISOString() || null,
    to: toDate.toISOString(),
    items: [...items, ...slaCycles],
  }
}

export async function getApplicationsTrend(filters = {}) {
  const { fromDate, toDate, period } = parseAnalyticsPeriod(filters)
  const start = fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const applications = await prisma.application.findMany({
    where: {
      ...notDeleted(),
      createdAt: { gte: start, lte: toDate },
    },
    select: { createdAt: true, currentStage: true },
    orderBy: { createdAt: 'asc' },
  })

  const buckets = new Map()

  for (const app of applications) {
    const key = app.createdAt.toISOString().slice(0, 10)
    if (!buckets.has(key)) {
      buckets.set(key, { date: key, applications: 0, hires: 0 })
    }
    const bucket = buckets.get(key)
    bucket.applications += 1
    if (app.currentStage === 'hired') bucket.hires += 1
  }

  const points = [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date))

  return { period, from: start.toISOString(), to: toDate.toISOString(), points }
}

function escapeCsv(value) {
  const text = String(value ?? '')
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function toCsv(headers, rows) {
  const lines = [headers.map(escapeCsv).join(',')]
  for (const row of rows) {
    lines.push(row.map(escapeCsv).join(','))
  }
  return lines.join('\n')
}

export async function exportAnalyticsReport(report, filters = {}) {
  if (report === 'funnel') {
    const funnel = await getConversionFunnel(filters)
    const rows = funnel.steps.map((step) => [
      step.label,
      step.count,
      `${step.percentage}%`,
    ])
    return {
      filename: `funil-conversao-${funnel.period}.csv`,
      content: toCsv(['Etapa', 'Candidaturas', 'Participação'], rows),
    }
  }

  if (report === 'by-state') {
    const data = await getApplicationsByState(filters)
    const rows = data.states.map((row) => [row.state, row.applications, row.hires])
    return {
      filename: `candidaturas-por-estado-${data.period}.csv`,
      content: toCsv(['Estado', 'Candidaturas', 'Contratações'], rows),
    }
  }

  if (report === 'stage-duration') {
    const data = await getStageDurationStats(filters)
    const rows = data.items.map((row) => [
      row.label,
      row.averageDays,
      row.averageHours,
      row.sampleSize,
    ])
    return {
      filename: `tempo-por-etapa-${data.period}.csv`,
      content: toCsv(['Etapa', 'Média (dias)', 'Média (horas)', 'Amostras'], rows),
    }
  }

  if (report === 'overview') {
    const data = await getAnalyticsOverview(filters)
    const rows = [
      ['Candidaturas no período', data.applicationsInPeriod],
      ['Contratações', data.hiresInPeriod],
      ['Reprovações', data.rejectedInPeriod],
      ['Taxa de conversão (%)', data.conversionRate],
      ['Entrevistas', data.interviewsInPeriod],
      ['Comunicações enviadas', data.communicationsSent],
      ['Vagas abertas', data.openJobs],
      ['Banco de talentos pendente', data.talentPoolPending],
    ]
    return {
      filename: `visao-geral-${data.period}.csv`,
      content: toCsv(['Indicador', 'Valor'], rows),
    }
  }

  throw new Error('INVALID_REPORT')
}
