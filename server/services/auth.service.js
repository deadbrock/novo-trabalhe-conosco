import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { env } from '../config/env.js'
import {
  findUserByEmail,
  findUserById,
  findUserByVerificationToken,
  createUser,
  updateUser,
} from '../storage/database.js'
import { sendVerificationEmail, sendWelcomeEmail } from './email.service.js'
import { EmailDeliveryError } from '../utils/sendgridError.js'

const SALT_ROUNDS = 10
const isDev = process.env.NODE_ENV !== 'production'

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

export function sanitizeUser(user) {
  const {
    passwordHash,
    verificationToken,
    verificationTokenExpires,
    ...safe
  } = user

  if (safe.profile?.resumeFilePath) {
    const { resumeFilePath, ...publicProfile } = safe.profile
    safe.profile = publicProfile
  }

  return safe
}

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  )
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret)
}

export async function registerCandidate({ name, email, password, phone, acceptTerms }) {
  if (!acceptTerms) {
    throw new Error('TERMS_REQUIRED')
  }

  const existing = findUserByEmail(email)
  if (existing) {
    throw new Error('EMAIL_IN_USE')
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const verificationToken = uuidv4()
  const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const user = createUser({
    id: uuidv4(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone?.trim() || '',
    passwordHash,
    role: 'candidate',
    emailVerified: false,
    verificationToken,
    verificationTokenExpires,
    profile: {
      linkedin: '',
      city: '',
      state: '',
      summary: '',
      resumeFileName: '',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  const emailResult = await deliverVerificationEmail({
    name: user.name,
    email: user.email,
    token: verificationToken,
  })

  return { user: sanitizeUser(user), ...emailResult }
}

export async function verifyEmail(token) {
  const user = findUserByVerificationToken(token)
  if (!user) throw new Error('INVALID_TOKEN')

  if (new Date(user.verificationTokenExpires) < new Date()) {
    throw new Error('TOKEN_EXPIRED')
  }

  if (user.emailVerified) {
    return sanitizeUser(user)
  }

  const updated = updateUser(user.id, {
    emailVerified: true,
    verificationToken: null,
    verificationTokenExpires: null,
  })

  try {
    await sendWelcomeEmail({ name: updated.name, email: updated.email })
  } catch (error) {
    console.warn('[E-mail] Boas-vindas não enviado:', error.message)
  }

  return sanitizeUser(updated)
}

export async function resendVerification(email) {
  const user = findUserByEmail(email)
  if (!user) throw new Error('USER_NOT_FOUND')
  if (user.emailVerified) throw new Error('ALREADY_VERIFIED')

  const verificationToken = uuidv4()
  const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  updateUser(user.id, { verificationToken, verificationTokenExpires })

  return deliverVerificationEmail({
    name: user.name,
    email: user.email,
    token: verificationToken,
  })
}

export async function loginCandidate({ email, password }) {
  const user = findUserByEmail(email)
  if (!user) throw new Error('INVALID_CREDENTIALS')

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new Error('INVALID_CREDENTIALS')

  if (!user.emailVerified) throw new Error('EMAIL_NOT_VERIFIED')

  const token = signToken(user)
  return { token, user: sanitizeUser(user) }
}

export function getCandidateById(id) {
  const user = findUserById(id)
  if (!user) return null
  return sanitizeUser(user)
}

export function updateCandidateProfile(id, profileUpdates) {
  const user = findUserById(id)
  if (!user) throw new Error('USER_NOT_FOUND')

  const updated = updateUser(id, {
    name: profileUpdates.name?.trim() || user.name,
    phone: profileUpdates.phone?.trim() ?? user.phone,
    profile: {
      ...user.profile,
      ...profileUpdates.profile,
    },
  })

  return sanitizeUser(updated)
}
