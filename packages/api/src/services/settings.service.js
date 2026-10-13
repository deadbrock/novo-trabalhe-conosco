import { prisma, notDeleted } from '../lib/prisma.js'
import { env } from '../config/env.js'
import bcrypt from 'bcryptjs'
import { ASSIGNABLE_STAFF_ROLES } from '@fg/contracts'
import { createAuditLog } from './audit.service.js'
import { getAuditActionLabel, getAuditEntityLabel } from '../constants/auditLabels.js'

function resolveUnitId(value) {
  if (value === undefined) return undefined
  const trimmed = String(value || '').trim()
  return trimmed || null
}

function mapStaffListItem(user) {
  const staff = user.staffProfile
  return {
    id: user.id,
    email: user.email,
    status: user.status,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
    name: staff?.name || '',
    phone: staff?.phone || '',
    jobTitle: staff?.jobTitle || '',
    department: staff?.department || '',
    avatarUrl: staff?.avatarUrl || '',
    role: staff?.role?.slug || '',
    roleName: staff?.role?.name || '',
    roleId: staff?.roleId || '',
    unitId: staff?.unitId || staff?.unit?.id || '',
    unitName: staff?.unit?.name || '',
    lastLoginAt: staff?.lastLoginAt?.toISOString() || null,
  }
}

export async function listStaffUsers() {
  const users = await prisma.user.findMany({
    where: { type: 'STAFF', ...notDeleted() },
    include: {
      staffProfile: {
        include: { role: true, unit: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return users.filter((u) => u.staffProfile).map(mapStaffListItem)
}

export async function listAssignableRoles() {
  const roles = await prisma.role.findMany({
    where: { slug: { in: [...ASSIGNABLE_STAFF_ROLES] }, ...notDeleted() },
    orderBy: { name: 'asc' },
  })

  return roles.map((role) => ({
    id: role.id,
    slug: role.slug,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
  }))
}

export async function createStaffUser(payload, actorId, auditContext = {}) {
  const email = payload.email?.toLowerCase()?.trim()
  const password = payload.password
  const name = payload.name?.trim()
  const roleId = payload.roleId

  if (!email || !password || !name || !roleId) throw new Error('VALIDATION')
  if (password.length < 8) throw new Error('WEAK_PASSWORD')

  const existing = await prisma.user.findFirst({
    where: { email, ...notDeleted() },
  })
  if (existing) throw new Error('EMAIL_IN_USE')

  const role = await prisma.role.findFirst({
    where: { id: roleId, slug: { in: [...ASSIGNABLE_STAFF_ROLES] }, ...notDeleted() },
  })
  if (!role) throw new Error('ROLE_NOT_FOUND')

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      type: 'STAFF',
      status: payload.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      emailVerified: true,
      staffProfile: {
        create: {
          roleId: role.id,
          name,
          phone: payload.phone?.trim() || '',
          jobTitle: payload.jobTitle?.trim() || '',
          department: payload.department?.trim() || '',
          unitId: resolveUnitId(payload.unitId) ?? null,
        },
      },
    },
    include: {
      staffProfile: { include: { role: true, unit: true } },
    },
  })

  await createAuditLog({
    actorId,
    action: 'settings.create_staff_user',
    entityType: 'User',
    entityId: user.id,
    metadata: { email, role: role.slug, name },
    ipAddress: auditContext.ipAddress,
  })

  return mapStaffListItem(user)
}

export async function listRoles() {
  const roles = await prisma.role.findMany({
    where: notDeleted(),
    orderBy: { name: 'asc' },
  })

  return roles.map((role) => ({
    id: role.id,
    slug: role.slug,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
  }))
}

export async function updateStaffUser(userId, updates, actorId, auditContext = {}) {
  const user = await prisma.user.findFirst({
    where: { id: userId, type: 'STAFF', ...notDeleted() },
    include: { staffProfile: { include: { role: true, unit: true } } },
  })
  if (!user?.staffProfile) throw new Error('USER_NOT_FOUND')

  const userData = {}
  const profileData = {}

  if (updates.status && ['ACTIVE', 'INACTIVE', 'PENDING'].includes(updates.status)) {
    userData.status = updates.status
  }

  if (updates.roleId) {
    const role = await prisma.role.findFirst({
      where: { id: updates.roleId, slug: { in: [...ASSIGNABLE_STAFF_ROLES] }, ...notDeleted() },
    })
    if (!role) throw new Error('ROLE_NOT_FOUND')
    profileData.roleId = role.id
  }

  if (typeof updates.name === 'string' && updates.name.trim()) {
    profileData.name = updates.name.trim()
  }
  if (typeof updates.phone === 'string') profileData.phone = updates.phone.trim()
  if (typeof updates.jobTitle === 'string') profileData.jobTitle = updates.jobTitle.trim()
  if (typeof updates.department === 'string') profileData.department = updates.department.trim()
  if (updates.unitId !== undefined) profileData.unitId = resolveUnitId(updates.unitId)

  if (Object.keys(userData).length === 0 && Object.keys(profileData).length === 0) {
    throw new Error('VALIDATION')
  }

  if (Object.keys(userData).length > 0) {
    await prisma.user.update({ where: { id: userId }, data: userData })
  }
  if (Object.keys(profileData).length > 0) {
    await prisma.staffProfile.update({ where: { id: user.staffProfile.id }, data: profileData })
  }

  await createAuditLog({
    actorId,
    action: 'settings.update_staff_user',
    entityType: 'User',
    entityId: userId,
    metadata: { userData, profileData },
    ipAddress: auditContext.ipAddress,
  })

  const updated = await prisma.user.findFirst({
    where: { id: userId, ...notDeleted() },
    include: { staffProfile: { include: { role: true, unit: true } } },
  })

  return mapStaffListItem(updated)
}

export async function getIntegrationsStatus() {
  return {
    sendgrid: {
      configured: Boolean(env.sendgridApiKey),
      fromEmail: env.sendgridFromEmail,
      fromName: env.sendgridFromName,
    },
    storage: {
      provider: env.storageProvider,
      localPath: env.storageProvider === 'LOCAL' ? env.storageLocalPath : undefined,
    },
    email: {
      appUrl: env.appUrl,
      adminUrl: env.adminUrl,
    },
  }
}

export async function listAuditLogs({ limit = 50, offset = 0 } = {}) {
  const take = Math.min(Math.max(limit, 1), 100)
  const skip = Math.max(offset, 0)

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          include: { staffProfile: true, candidateProfile: true },
        },
      },
    }),
    prisma.auditLog.count(),
  ])

  return {
    logs: logs.map((log) => ({
      id: log.id,
      action: log.action,
      actionLabel: getAuditActionLabel(log.action),
      entityType: log.entityType,
      entityLabel: getAuditEntityLabel(log.entityType),
      entityId: log.entityId,
      metadata: log.metadata,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt.toISOString(),
      actor: log.actor
        ? {
            id: log.actor.id,
            email: log.actor.email,
            name: log.actor.staffProfile?.name || log.actor.candidateProfile?.name || log.actor.email,
          }
        : null,
    })),
    total,
    limit: take,
    offset: skip,
  }
}
