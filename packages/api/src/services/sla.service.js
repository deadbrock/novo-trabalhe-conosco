import { prisma } from '../lib/prisma.js'

const CLOCK = {
  RH: 'RH_DOCUMENTATION',
  DP: 'DP_ADMISSION',
}

function elapsedMs(clock, now = new Date()) {
  if (!clock) return 0
  const running =
    clock.status === 'RUNNING' && clock.runningSince
      ? now.getTime() - new Date(clock.runningSince).getTime()
      : 0
  return Math.max(0, (clock.accumulatedMs || 0) + running)
}

export function mapSlaClock(clock, now = new Date()) {
  if (!clock) return null
  const ms = elapsedMs(clock, now)
  return {
    type: clock.type,
    status: clock.status,
    startedAt: clock.startedAt?.toISOString?.() || clock.startedAt,
    completedAt: clock.completedAt?.toISOString?.() || clock.completedAt || null,
    elapsedMs: ms,
    elapsedHours: Math.round((ms / 3_600_000) * 10) / 10,
    elapsedDays: Math.round((ms / 86_400_000) * 10) / 10,
  }
}

export function mapApplicationSla(application, now = new Date()) {
  const clocks = application?.slaClocks || []
  const rh = clocks.find((clock) => clock.type === CLOCK.RH)
  const dp = clocks.find((clock) => clock.type === CLOCK.DP)
  return {
    currentOwner: application?.currentOwner || 'LOCAL',
    unitId: application?.unitId || application?.unit?.id || null,
    unitName: application?.unit?.name || null,
    returnedReason: application?.returnedReason || '',
    returnedAt: application?.returnedAt?.toISOString?.() || application?.returnedAt || null,
    interviewApprovedAt: application?.interviewApprovedAt?.toISOString?.() || null,
    forwardedToDpAt: application?.forwardedToDpAt?.toISOString?.() || null,
    dpCompletedAt: application?.dpCompletedAt?.toISOString?.() || null,
    rhClock: mapSlaClock(rh, now),
    dpClock: mapSlaClock(dp, now),
  }
}

export async function startSlaClock(applicationId, type) {
  const existing = await prisma.applicationSlaClock.findUnique({
    where: { applicationId_type: { applicationId, type } },
  })
  if (existing?.status === 'RUNNING') return existing
  if (existing?.status === 'PAUSED') return resumeSlaClock(applicationId, type)

  const now = new Date()
  if (existing) {
    return prisma.applicationSlaClock.update({
      where: { id: existing.id },
      data: {
        status: 'RUNNING',
        startedAt: existing.startedAt || now,
        runningSince: now,
        pausedAt: null,
        completedAt: null,
      },
    })
  }

  return prisma.applicationSlaClock.create({
    data: {
      applicationId,
      type,
      status: 'RUNNING',
      startedAt: now,
      runningSince: now,
      accumulatedMs: 0,
    },
  })
}

export async function pauseSlaClock(applicationId, type) {
  const clock = await prisma.applicationSlaClock.findUnique({
    where: { applicationId_type: { applicationId, type } },
  })
  if (!clock || clock.status !== 'RUNNING') return clock

  const now = new Date()
  const segment = now.getTime() - new Date(clock.runningSince).getTime()

  return prisma.applicationSlaClock.update({
    where: { id: clock.id },
    data: {
      status: 'PAUSED',
      pausedAt: now,
      accumulatedMs: clock.accumulatedMs + Math.max(0, segment),
    },
  })
}

export async function resumeSlaClock(applicationId, type) {
  const clock = await prisma.applicationSlaClock.findUnique({
    where: { applicationId_type: { applicationId, type } },
  })
  if (!clock) return startSlaClock(applicationId, type)
  if (clock.status === 'COMPLETED') return clock

  const now = new Date()
  return prisma.applicationSlaClock.update({
    where: { id: clock.id },
    data: {
      status: 'RUNNING',
      runningSince: now,
      pausedAt: null,
    },
  })
}

export async function completeSlaClock(applicationId, type) {
  const clock = await prisma.applicationSlaClock.findUnique({
    where: { applicationId_type: { applicationId, type } },
  })
  if (!clock || clock.status === 'COMPLETED') return clock

  const now = new Date()
  const extra = clock.status === 'RUNNING' ? now.getTime() - new Date(clock.runningSince).getTime() : 0

  return prisma.applicationSlaClock.update({
    where: { id: clock.id },
    data: {
      status: 'COMPLETED',
      completedAt: now,
      accumulatedMs: clock.accumulatedMs + Math.max(0, extra),
    },
  })
}

export async function markInterviewApproved(applicationId) {
  const now = new Date()
  await prisma.application.update({
    where: { id: applicationId },
    data: {
      currentOwner: 'LOCAL',
      interviewApprovedAt: now,
      returnedReason: '',
      returnedAt: null,
    },
  })
  await startSlaClock(applicationId, CLOCK.RH)
}

export async function returnDocumentationToOrigin(applicationId, reason) {
  const trimmed = String(reason || '').trim()
  await prisma.application.update({
    where: { id: applicationId },
    data: {
      currentOwner: 'LOCAL',
      returnedReason: trimmed,
      returnedAt: new Date(),
    },
  })
}

export async function markForwardedToDp(applicationId) {
  const now = new Date()
  await prisma.application.update({
    where: { id: applicationId },
    data: {
      currentOwner: 'DP',
      forwardedToDpAt: now,
      returnedReason: '',
      returnedAt: null,
    },
  })
  await completeSlaClock(applicationId, CLOCK.RH)
  await startSlaClock(applicationId, CLOCK.DP)
}

export async function returnAdmissionToRh(applicationId, reason) {
  await prisma.application.update({
    where: { id: applicationId },
    data: {
      currentOwner: 'HQ_HR',
      returnedReason: String(reason || '').trim(),
      returnedAt: new Date(),
    },
  })
  await pauseSlaClock(applicationId, CLOCK.DP)
}

export async function markDpAdmissionCompleted(applicationId) {
  await prisma.application.update({
    where: { id: applicationId },
    data: {
      dpCompletedAt: new Date(),
    },
  })
  await completeSlaClock(applicationId, CLOCK.DP)
}

export async function getSlaCycleStats() {
  const clocks = await prisma.applicationSlaClock.findMany({
    where: { status: 'COMPLETED' },
  })

  function summarize(type, label) {
    const samples = clocks.filter((clock) => clock.type === type).map((clock) => elapsedMs(clock))
    const averageHours =
      samples.length > 0
        ? Math.round((samples.reduce((sum, ms) => sum + ms, 0) / samples.length / 3_600_000) * 10) / 10
        : 0
    return {
      slug: type.toLowerCase(),
      label,
      averageHours,
      averageDays: Math.round((averageHours / 24) * 10) / 10,
      sampleSize: samples.length,
      sortOrder: type === CLOCK.RH ? 90 : 91,
    }
  }

  return [
    summarize(CLOCK.RH, 'RH — entrevista aprovada até dossiê no DP'),
    summarize(CLOCK.DP, 'DP — fila até admissão concluída'),
  ].filter((item) => item.sampleSize > 0)
}

export const SLA_CLOCK = CLOCK
