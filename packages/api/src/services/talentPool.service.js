import { prisma, notDeleted } from '../lib/prisma.js'
import { storageService } from '../storage/index.js'
import { createAuditLog } from './audit.service.js'

export async function submitTalentPoolEntry({ data, file }, auditContext = {}) {
  const email = data.email.toLowerCase().trim()

  const existing = await prisma.talentPoolEntry.findFirst({
    where: { email, ...notDeleted() },
  })
  if (existing) throw new Error('EMAIL_ALREADY_REGISTERED')

  const ext = file.originalname.match(/\.[^.]+$/)?.[0] || '.pdf'
  const key = `talent-pool/${Date.now()}-${email.replace(/[^a-z0-9]/gi, '')}${ext}`

  const stored = await storageService.upload(file, { key, directory: 'talent-pool' })

  const document = await prisma.document.create({
    data: {
      ownerType: 'TALENT_POOL',
      ownerId: email,
      type: 'resume',
      storageKey: stored.key,
      provider: stored.provider,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    },
  })

  const entry = await prisma.talentPoolEntry.create({
    data: {
      name: data.name.trim(),
      email,
      phone: data.phone.trim(),
      area: data.area,
      areaLabel: data.areaLabel || data.area,
      desiredJob: data.desiredJob.trim(),
      desiredJobSlug: data.desiredJobSlug || '',
      linkedin: data.linkedin?.trim() || '',
      message: data.message?.trim() || '',
      documentId: document.id,
      status: 'PENDING',
    },
  })

  await createAuditLog({
    action: 'talent_pool.submit',
    entityType: 'TalentPoolEntry',
    entityId: entry.id,
    metadata: { email, desiredJob: entry.desiredJob },
    ipAddress: auditContext.ipAddress,
  })

  return entry
}

function mapTalentPoolEntry(entry) {
  return {
    id: entry.id,
    name: entry.name,
    email: entry.email,
    phone: entry.phone,
    area: entry.area,
    areaLabel: entry.areaLabel,
    desiredJob: entry.desiredJob,
    desiredJobSlug: entry.desiredJobSlug,
    linkedin: entry.linkedin,
    message: entry.message,
    status: entry.status,
    hasResume: Boolean(entry.documentId && entry.document),
    resumeFileName: entry.document?.originalName || null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  }
}

const entryInclude = {
  document: {
    select: { id: true, originalName: true, mimeType: true, storageKey: true },
  },
}

function buildTalentPoolWhere(filters = {}) {
  const where = { ...notDeleted() }

  if (filters.status && filters.status !== 'undefined') where.status = filters.status
  if (filters.area && filters.area !== 'undefined') where.area = filters.area

  if (filters.search?.trim()) {
    const term = filters.search.trim()
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { desiredJob: { contains: term, mode: 'insensitive' } },
      { areaLabel: { contains: term, mode: 'insensitive' } },
    ]
  }

  return where
}

export async function listTalentPoolAdmin(filters = {}) {
  const entries = await prisma.talentPoolEntry.findMany({
    where: buildTalentPoolWhere(filters),
    include: entryInclude,
    orderBy: { createdAt: 'desc' },
  })

  return entries.map(mapTalentPoolEntry)
}

export async function getTalentPoolAdmin(id) {
  const entry = await prisma.talentPoolEntry.findFirst({
    where: { id, ...notDeleted() },
    include: entryInclude,
  })
  if (!entry) return null
  return mapTalentPoolEntry(entry)
}

export async function getTalentPoolStats() {
  const [pending, reviewed, converted, archived, total] = await Promise.all([
    prisma.talentPoolEntry.count({ where: { status: 'PENDING', ...notDeleted() } }),
    prisma.talentPoolEntry.count({ where: { status: 'REVIEWED', ...notDeleted() } }),
    prisma.talentPoolEntry.count({ where: { status: 'CONVERTED', ...notDeleted() } }),
    prisma.talentPoolEntry.count({ where: { status: 'ARCHIVED', ...notDeleted() } }),
    prisma.talentPoolEntry.count({ where: notDeleted() }),
  ])

  return { pending, reviewed, converted, archived, total }
}

export async function updateTalentPoolStatus(id, status, actorId, auditContext = {}) {
  const validStatuses = ['PENDING', 'REVIEWED', 'CONVERTED', 'ARCHIVED']
  if (!validStatuses.includes(status)) throw new Error('INVALID_STATUS')

  const entry = await prisma.talentPoolEntry.findFirst({
    where: { id, ...notDeleted() },
  })
  if (!entry) throw new Error('NOT_FOUND')

  const updated = await prisma.talentPoolEntry.update({
    where: { id },
    data: { status },
    include: entryInclude,
  })

  await createAuditLog({
    actorId,
    action: 'talent_pool.status_update',
    entityType: 'TalentPoolEntry',
    entityId: id,
    metadata: { from: entry.status, to: status, email: entry.email },
    ipAddress: auditContext.ipAddress,
  })

  return mapTalentPoolEntry(updated)
}

export async function streamTalentPoolResume(id) {
  const entry = await prisma.talentPoolEntry.findFirst({
    where: { id, ...notDeleted() },
    include: { document: true },
  })

  if (!entry?.document) return null

  const exists = await storageService.exists(entry.document.storageKey)
  if (!exists) return null

  const downloaded = await storageService.download(entry.document.storageKey)
  return {
    stream: downloaded.stream,
    mimeType: entry.document.mimeType,
    originalName: entry.document.originalName,
  }
}

export async function listTalentPoolAreas() {
  const rows = await prisma.talentPoolEntry.findMany({
    where: notDeleted(),
    select: { area: true, areaLabel: true },
    distinct: ['area'],
    orderBy: { areaLabel: 'asc' },
  })

  return rows.map((row) => ({
    id: row.area,
    label: row.areaLabel || row.area,
  }))
}
