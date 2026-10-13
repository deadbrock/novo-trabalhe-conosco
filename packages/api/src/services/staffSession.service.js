import crypto from 'node:crypto'
import { prisma, notDeleted, softDeleteData } from '../lib/prisma.js'
import { env } from '../config/env.js'

const REFRESH_TTL_MS = parseDuration(env.staffRefreshExpiresIn || '30d')

function parseDuration(str) {
  const match = /^(\d+)([dhms])$/.exec(str)
  if (!match) return 30 * 24 * 60 * 60 * 1000
  const n = Number(match[1])
  const unit = match[2]
  const multipliers = { d: 86400000, h: 3600000, m: 60000, s: 1000 }
  return n * multipliers[unit]
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function generateRefreshTokenValue() {
  return crypto.randomBytes(48).toString('base64url')
}

export async function createStaffRefreshToken(userId) {
  const token = generateRefreshTokenValue()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS)

  await prisma.staffRefreshToken.create({
    data: { userId, tokenHash, expiresAt },
  })

  return { token, expiresAt }
}

export async function validateStaffRefreshToken(token) {
  const tokenHash = hashToken(token)
  const record = await prisma.staffRefreshToken.findFirst({
    where: {
      tokenHash,
      ...notDeleted(),
      expiresAt: { gt: new Date() },
    },
  })
  return record
}

export async function revokeStaffRefreshToken(token) {
  const tokenHash = hashToken(token)
  const record = await prisma.staffRefreshToken.findFirst({
    where: { tokenHash, ...notDeleted() },
  })
  if (!record) return
  await prisma.staffRefreshToken.update({
    where: { id: record.id },
    data: softDeleteData(),
  })
}

export async function revokeAllStaffRefreshTokens(userId) {
  await prisma.staffRefreshToken.updateMany({
    where: { userId, ...notDeleted() },
    data: softDeleteData(),
  })
}
