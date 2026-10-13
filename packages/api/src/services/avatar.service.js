import path from 'node:path'
import bcrypt from 'bcryptjs'
import { prisma, notDeleted } from '../lib/prisma.js'
import { storageService } from '../storage/index.js'
import { createAuditLog } from './audit.service.js'
import { getStaffById } from './auth.service.js'

export const AVATAR_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

const SALT_ROUNDS = 10

function extractAvatarStorageKey(avatarUrl) {
  if (!avatarUrl) return null
  const marker = '/api/files/avatars/'
  const index = avatarUrl.indexOf(marker)
  if (index === -1) return null
  return `avatars/${avatarUrl.slice(index + marker.length).split('?')[0]}`
}

export async function updateStaffProfile(userId, updates, auditContext = {}) {
  const user = await prisma.user.findFirst({
    where: { id: userId, type: 'STAFF', ...notDeleted() },
    include: { staffProfile: true },
  })
  if (!user?.staffProfile) throw new Error('USER_NOT_FOUND')

  const data = {}
  if (typeof updates.name === 'string' && updates.name.trim()) {
    data.name = updates.name.trim()
  }
  if (typeof updates.phone === 'string') {
    data.phone = updates.phone.trim()
  }
  if (typeof updates.jobTitle === 'string') {
    data.jobTitle = updates.jobTitle.trim()
  }
  if (typeof updates.department === 'string') {
    data.department = updates.department.trim()
  }

  if (Object.keys(data).length === 0) throw new Error('VALIDATION')

  await prisma.staffProfile.update({
    where: { id: user.staffProfile.id },
    data,
  })

  await createAuditLog({
    actorId: userId,
    action: 'staff.update_profile',
    entityType: 'StaffProfile',
    entityId: user.staffProfile.id,
    metadata: { fields: Object.keys(data) },
    ipAddress: auditContext.ipAddress,
  })

  return getStaffById(userId)
}

export async function changeStaffPassword(userId, { currentPassword, newPassword }, auditContext = {}) {
  if (!currentPassword || !newPassword) throw new Error('VALIDATION')
  if (newPassword.length < 8) throw new Error('WEAK_PASSWORD')

  const user = await prisma.user.findFirst({
    where: { id: userId, type: 'STAFF', ...notDeleted() },
  })
  if (!user) throw new Error('USER_NOT_FOUND')

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) throw new Error('INVALID_PASSWORD')

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  })

  await createAuditLog({
    actorId: userId,
    action: 'staff.change_password',
    entityType: 'User',
    entityId: userId,
    ipAddress: auditContext.ipAddress,
  })

  return { message: 'Senha alterada com sucesso.' }
}

export async function uploadStaffAvatar(userId, file, auditContext = {}) {
  if (!AVATAR_MIME[file.mimetype]) throw new Error('INVALID_AVATAR_TYPE')

  const user = await prisma.user.findFirst({
    where: { id: userId, type: 'STAFF', ...notDeleted() },
    include: { staffProfile: true },
  })
  if (!user?.staffProfile) throw new Error('USER_NOT_FOUND')

  const ext = AVATAR_MIME[file.mimetype] || path.extname(file.originalname) || '.jpg'
  const filename = `${userId}-${Date.now()}${ext}`
  const key = filename

  const previousKey = extractAvatarStorageKey(user.staffProfile.avatarUrl)
  if (previousKey) {
    await storageService.delete(previousKey).catch(() => {})
  }

  await storageService.upload(file, { key, directory: 'avatars' })

  const avatarUrl = `/api/files/avatars/${filename}?v=${Date.now()}`

  await prisma.staffProfile.update({
    where: { id: user.staffProfile.id },
    data: { avatarUrl },
  })

  await createAuditLog({
    actorId: userId,
    action: 'staff.upload_avatar',
    entityType: 'StaffProfile',
    entityId: user.staffProfile.id,
    ipAddress: auditContext.ipAddress,
  })

  return getStaffById(userId)
}

export async function removeStaffAvatar(userId, auditContext = {}) {
  const user = await prisma.user.findFirst({
    where: { id: userId, type: 'STAFF', ...notDeleted() },
    include: { staffProfile: true },
  })
  if (!user?.staffProfile) throw new Error('USER_NOT_FOUND')

  const previousKey = extractAvatarStorageKey(user.staffProfile.avatarUrl)
  if (previousKey) {
    await storageService.delete(previousKey).catch(() => {})
  }

  await prisma.staffProfile.update({
    where: { id: user.staffProfile.id },
    data: { avatarUrl: '' },
  })

  await createAuditLog({
    actorId: userId,
    action: 'staff.remove_avatar',
    entityType: 'StaffProfile',
    entityId: user.staffProfile.id,
    ipAddress: auditContext.ipAddress,
  })

  return getStaffById(userId)
}
