import { prisma } from '../lib/prisma.js'

export async function createAuditLog({
  actorId = null,
  action,
  entityType,
  entityId,
  metadata = {},
  ipAddress = '',
}) {
  return prisma.auditLog.create({
    data: {
      actorId,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress,
    },
  })
}

export function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || ''
}
