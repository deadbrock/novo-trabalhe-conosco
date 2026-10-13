import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { env } from '../config/env.js'
import { prisma, notDeleted } from '../lib/prisma.js'
import { sendVerificationEmail, sendWelcomeEmail } from './email.service.js'
import { EmailDeliveryError } from '../utils/sendgridError.js'
import { createStaffRefreshToken, revokeStaffRefreshToken, validateStaffRefreshToken } from './staffSession.service.js'
import { createAuditLog } from './audit.service.js'
import { mapStoredProfile, buildProfileUpdateData } from '../utils/candidateProfile.js'

const SALT_ROUNDS = 10
const isDev = env.nodeEnv !== 'production'

const candidateInclude = {
  candidateProfile: {
    include: {
      documents: {
        where: { ...notDeleted(), type: 'resume' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  },
}

function mapCandidateUser(user) {
  const profile = user.candidateProfile
  const resume = profile?.documents?.[0]
  const storedProfile = mapStoredProfile(profile)

  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    role: 'candidate',
    name: profile?.name || '',
    phone: profile?.phone || '',
    profile: {
      ...storedProfile,
      resumeFileName: resume?.originalName || '',
      resumeOriginalName: resume?.originalName || '',
      resumeMimeType: resume?.mimeType || '',
      resumeSize: resume?.size || 0,
      resumeUploadedAt: resume?.createdAt?.toISOString() || null,
    },
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}

function mapStaffUser(user) {
  const staff = user.staffProfile
  const permissions = staff?.role?.permissions?.map((rp) => `${rp.permission.module}:${rp.permission.action}`) || []

  return {
    id: user.id,
    email: user.email,
    type: 'staff',
    name: staff?.name || '',
    phone: staff?.phone || '',
    jobTitle: staff?.jobTitle || '',
    department: staff?.department || '',
    role: staff?.role?.slug || '',
    roleName: staff?.role?.name || '',
    permissions,
    scope: {
      states: staff?.scopeStates || [],
      cities: staff?.scopeCities || [],
      contracts: staff?.scopeContracts || [],
    },
    unitId: staff?.unitId || staff?.unit?.id || null,
    unit: staff?.unit
      ? {
          id: staff.unit.id,
          name: staff.unit.name,
          slug: staff.unit.slug,
          type: staff.unit.type,
          stateCodes: staff.unit.stateCodes || [],
          isHeadquarters: staff.unit.isHeadquarters,
        }
      : null,
    avatarUrl: staff?.avatarUrl || '',
    lastLoginAt: staff?.lastLoginAt?.toISOString() || null,
  }
}

async function deliverVerificationEmail({ name, email, token }) {
  const verifyUrl = `${env.appUrl}/verificar-email?token=${token}`

  try {
    await sendVerificationEmail({ name, email, token })
    return { message: 'E-mail de verificação enviado.', verifyUrl, emailSent: true }
  } catch (error) {
    if (error instanceof EmailDeliveryError && isDev) {
      console.warn('[DEV] SendGrid indisponível. Link de verificação:', verifyUrl)
      return {
        message: 'Conta criada, mas o SendGrid não enviou o e-mail. Use o link de verificação abaixo (modo dev).',
        verifyUrl,
        emailSent: false,
        emailError: error.message,
      }
    }
    throw error
  }
}

export function signCandidateToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, type: 'candidate' },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  )
}

export function signStaffToken(user, staffProfile) {
  const permissions = staffProfile.role?.permissions?.map((rp) => `${rp.permission.module}:${rp.permission.action}`) || []

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      type: 'staff',
      role: staffProfile.role?.slug,
      permissions,
      scope: {
        states: staffProfile.scopeStates,
        cities: staffProfile.scopeCities,
        contracts: staffProfile.scopeContracts,
      },
      unitId: staffProfile.unitId || staffProfile.unit?.id || null,
    },
    env.jwtSecret,
    { expiresIn: env.staffJwtExpiresIn },
  )
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret)
}

export async function registerCandidate({ name, email, password, phone, acceptTerms }, auditContext = {}) {
  if (!acceptTerms) throw new Error('TERMS_REQUIRED')

  const normalizedEmail = email.toLowerCase().trim()
  const existing = await prisma.user.findFirst({
    where: { email: normalizedEmail, ...notDeleted() },
  })
  if (existing) throw new Error('EMAIL_IN_USE')

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const verificationToken = uuidv4()
  const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      type: 'CANDIDATE',
      status: 'PENDING',
      emailVerified: false,
      verificationToken,
      verificationTokenExpires,
      candidateProfile: {
        create: {
          name: name.trim(),
          phone: phone?.trim() || '',
        },
      },
    },
    include: candidateInclude,
  })

  await createAuditLog({
    actorId: user.id,
    action: 'candidate.register',
    entityType: 'User',
    entityId: user.id,
    ipAddress: auditContext.ipAddress,
  })

  const emailResult = await deliverVerificationEmail({
    name: user.candidateProfile.name,
    email: user.email,
    token: verificationToken,
  })

  return { user: mapCandidateUser(user), ...emailResult }
}

export async function verifyEmail(token, auditContext = {}) {
  const user = await prisma.user.findFirst({
    where: { verificationToken: token, ...notDeleted() },
    include: candidateInclude,
  })
  if (!user) throw new Error('INVALID_TOKEN')
  if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
    throw new Error('TOKEN_EXPIRED')
  }

  if (user.emailVerified) return mapCandidateUser(user)

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      status: 'ACTIVE',
      verificationToken: null,
      verificationTokenExpires: null,
    },
    include: candidateInclude,
  })

  await createAuditLog({
    actorId: user.id,
    action: 'candidate.verify_email',
    entityType: 'User',
    entityId: user.id,
    ipAddress: auditContext.ipAddress,
  })

  try {
    await sendWelcomeEmail({ name: updated.candidateProfile.name, email: updated.email })
  } catch (error) {
    console.warn('[E-mail] Boas-vindas não enviado:', error.message)
  }

  return mapCandidateUser(updated)
}

export async function resendVerification(email) {
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase().trim(), type: 'CANDIDATE', ...notDeleted() },
    include: candidateInclude,
  })
  if (!user) throw new Error('USER_NOT_FOUND')
  if (user.emailVerified) throw new Error('ALREADY_VERIFIED')

  const verificationToken = uuidv4()
  const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma.user.update({
    where: { id: user.id },
    data: { verificationToken, verificationTokenExpires },
  })

  return deliverVerificationEmail({
    name: user.candidateProfile.name,
    email: user.email,
    token: verificationToken,
  })
}

export async function loginCandidate({ email, password }, auditContext = {}) {
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase().trim(), type: 'CANDIDATE', ...notDeleted() },
    include: candidateInclude,
  })
  if (!user) throw new Error('INVALID_CREDENTIALS')

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new Error('INVALID_CREDENTIALS')
  if (!user.emailVerified) throw new Error('EMAIL_NOT_VERIFIED')

  const token = signCandidateToken(user)

  await createAuditLog({
    actorId: user.id,
    action: 'candidate.login',
    entityType: 'User',
    entityId: user.id,
    ipAddress: auditContext.ipAddress,
  })

  return { token, user: mapCandidateUser(user) }
}

export async function loginStaff({ email, password }, auditContext = {}) {
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase().trim(), type: 'STAFF', ...notDeleted() },
    include: {
      staffProfile: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
          unit: true,
        },
      },
    },
  })
  if (!user || !user.staffProfile) throw new Error('INVALID_CREDENTIALS')

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new Error('INVALID_CREDENTIALS')
  if (user.status !== 'ACTIVE') throw new Error('ACCOUNT_INACTIVE')

  await prisma.staffProfile.update({
    where: { id: user.staffProfile.id },
    data: { lastLoginAt: new Date() },
  })

  const token = signStaffToken(user, user.staffProfile)
  const refresh = await createStaffRefreshToken(user.id)

  await createAuditLog({
    actorId: user.id,
    action: 'staff.login',
    entityType: 'User',
    entityId: user.id,
    ipAddress: auditContext.ipAddress,
  })

  return {
    token,
    refreshToken: refresh.token,
    refreshExpiresAt: refresh.expiresAt.toISOString(),
    user: mapStaffUser(user),
  }
}

export async function getCandidateById(id) {
  const user = await prisma.user.findFirst({
    where: { id, type: 'CANDIDATE', ...notDeleted() },
    include: candidateInclude,
  })
  if (!user) return null
  return mapCandidateUser(user)
}

export async function getStaffById(id) {
  const user = await prisma.user.findFirst({
    where: { id, type: 'STAFF', ...notDeleted() },
    include: {
      staffProfile: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
          unit: true,
        },
      },
    },
  })
  if (!user) return null
  return mapStaffUser(user)
}

export async function updateCandidateProfile(id, profileUpdates, auditContext = {}) {
  const user = await prisma.user.findFirst({
    where: { id, type: 'CANDIDATE', ...notDeleted() },
    include: { candidateProfile: true },
  })
  if (!user?.candidateProfile) throw new Error('USER_NOT_FOUND')

  let data
  try {
    data = buildProfileUpdateData(profileUpdates, user.candidateProfile)
  } catch (error) {
    if (error.message === 'INVALID_CPF') throw new Error('INVALID_CPF')
    if (error.message === 'INVALID_BIRTH_DATE') throw new Error('INVALID_BIRTH_DATE')
    throw error
  }

  await prisma.candidateProfile.update({
    where: { id: user.candidateProfile.id },
    data,
  })

  await createAuditLog({
    actorId: id,
    action: 'candidate.update_profile',
    entityType: 'CandidateProfile',
    entityId: user.candidateProfile.id,
    ipAddress: auditContext.ipAddress,
  })

  return getCandidateById(id)
}

export async function refreshStaffSession(refreshToken, auditContext = {}) {
  const record = await validateStaffRefreshToken(refreshToken)
  if (!record) throw new Error('INVALID_REFRESH_TOKEN')

  const user = await prisma.user.findFirst({
    where: { id: record.userId, type: 'STAFF', status: 'ACTIVE', ...notDeleted() },
    include: {
      staffProfile: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
          unit: true,
        },
      },
    },
  })
  if (!user?.staffProfile) throw new Error('INVALID_REFRESH_TOKEN')

  await revokeStaffRefreshToken(refreshToken)
  const token = signStaffToken(user, user.staffProfile)
  const refresh = await createStaffRefreshToken(user.id)

  await createAuditLog({
    actorId: user.id,
    action: 'staff.refresh_token',
    entityType: 'User',
    entityId: user.id,
    ipAddress: auditContext.ipAddress,
  })

  return {
    token,
    refreshToken: refresh.token,
    refreshExpiresAt: refresh.expiresAt.toISOString(),
    user: mapStaffUser(user),
  }
}

export async function logoutStaff(refreshToken, userId, auditContext = {}) {
  if (refreshToken) {
    await revokeStaffRefreshToken(refreshToken)
  }

  if (userId) {
    await createAuditLog({
      actorId: userId,
      action: 'staff.logout',
      entityType: 'User',
      entityId: userId,
      ipAddress: auditContext.ipAddress,
    })
  }
}

export { mapCandidateUser, mapStaffUser }
