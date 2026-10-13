import path from 'node:path'
import { prisma, notDeleted, softDeleteData } from '../lib/prisma.js'
import { storageService } from '../storage/index.js'
import { getCandidateById } from './auth.service.js'
import { createAuditLog } from './audit.service.js'

const ALLOWED_MIME = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
}

export const DOCUMENTATION_MIME = {
  ...ALLOWED_MIME,
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

export { ALLOWED_MIME }

export function getResumeExtension(mimetype, originalname) {
  return ALLOWED_MIME[mimetype] || path.extname(originalname)
}

export function getDocumentationExtension(mimetype, originalname) {
  return DOCUMENTATION_MIME[mimetype] || path.extname(originalname)
}

export async function saveUserResume(userId, file, auditContext = {}) {
  const user = await prisma.user.findFirst({
    where: { id: userId, type: 'CANDIDATE', ...notDeleted() },
    include: { candidateProfile: true },
  })
  if (!user?.candidateProfile) throw new Error('USER_NOT_FOUND')

  const ext = getResumeExtension(file.mimetype, file.originalname)
  const key = `resumes/${userId}-${Date.now()}${ext}`

  const previous = await prisma.document.findFirst({
    where: {
      candidateId: user.candidateProfile.id,
      type: 'resume',
      ...notDeleted(),
    },
  })

  if (previous) {
    await storageService.delete(previous.storageKey).catch(() => {})
    await prisma.document.update({
      where: { id: previous.id },
      data: softDeleteData(),
    })
  }

  const stored = await storageService.upload(file, { key, directory: 'resumes' })

  await prisma.document.create({
    data: {
      ownerType: 'CANDIDATE',
      ownerId: user.candidateProfile.id,
      candidateId: user.candidateProfile.id,
      type: 'resume',
      storageKey: stored.key,
      provider: stored.provider,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    },
  })

  await createAuditLog({
    actorId: userId,
    action: 'candidate.upload_resume',
    entityType: 'Document',
    entityId: user.candidateProfile.id,
    ipAddress: auditContext.ipAddress,
  })

  return getCandidateById(userId)
}

export async function getUserResumeFile(userId) {
  const user = await prisma.user.findFirst({
    where: { id: userId, type: 'CANDIDATE', ...notDeleted() },
    include: { candidateProfile: true },
  })
  if (!user?.candidateProfile) return null

  const document = await prisma.document.findFirst({
    where: {
      candidateId: user.candidateProfile.id,
      type: 'resume',
      ...notDeleted(),
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!document) return null

  const exists = await storageService.exists(document.storageKey)
  if (!exists) return null

  return {
    storageKey: document.storageKey,
    originalName: document.originalName,
    mimeType: document.mimeType,
  }
}

export async function removeUserResume(userId, auditContext = {}) {
  const user = await prisma.user.findFirst({
    where: { id: userId, type: 'CANDIDATE', ...notDeleted() },
    include: { candidateProfile: true },
  })
  if (!user?.candidateProfile) throw new Error('USER_NOT_FOUND')

  const document = await prisma.document.findFirst({
    where: {
      candidateId: user.candidateProfile.id,
      type: 'resume',
      ...notDeleted(),
    },
    orderBy: { createdAt: 'desc' },
  })

  if (document) {
    await storageService.delete(document.storageKey).catch(() => {})
    await prisma.document.update({
      where: { id: document.id },
      data: softDeleteData(),
    })
  }

  await createAuditLog({
    actorId: userId,
    action: 'candidate.delete_resume',
    entityType: 'Document',
    entityId: user.candidateProfile.id,
    ipAddress: auditContext.ipAddress,
  })

  return getCandidateById(userId)
}

export async function streamUserResume(userId) {
  const resume = await getUserResumeFile(userId)
  if (!resume) return null

  const downloaded = await storageService.download(resume.storageKey)
  return {
    ...downloaded,
    mimeType: resume.mimeType,
    originalName: resume.originalName,
  }
}
