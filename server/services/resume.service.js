import fs from 'node:fs'
import path from 'node:path'
import { findUserById, updateUser } from '../storage/database.js'
import { deleteResumeFile, UPLOADS_DIR } from '../config/uploads.js'
import { sanitizeUser } from './auth.service.js'

export function saveUserResume(userId, file) {
  const user = findUserById(userId)
  if (!user) throw new Error('USER_NOT_FOUND')

  const previousPath = user.profile?.resumeFilePath
  deleteResumeFile(previousPath)

  const updated = updateUser(userId, {
    profile: {
      ...user.profile,
      resumeFileName: file.filename,
      resumeOriginalName: file.originalname,
      resumeFilePath: file.path,
      resumeUploadedAt: new Date().toISOString(),
      resumeMimeType: file.mimetype,
      resumeSize: file.size,
    },
  })

  return sanitizeUser(updated)
}

export function getUserResumeFile(userId) {
  const user = findUserById(userId)
  if (!user?.profile?.resumeFilePath) return null

  const filePath = user.profile.resumeFilePath
  if (!fs.existsSync(filePath)) return null

  return {
    filePath,
    originalName: user.profile.resumeOriginalName || user.profile.resumeFileName,
    mimeType: user.profile.resumeMimeType || 'application/octet-stream',
  }
}

export function removeUserResume(userId) {
  const user = findUserById(userId)
  if (!user) throw new Error('USER_NOT_FOUND')

  deleteResumeFile(user.profile?.resumeFilePath)

  const updated = updateUser(userId, {
    profile: {
      ...user.profile,
      resumeFileName: '',
      resumeOriginalName: '',
      resumeFilePath: '',
      resumeUploadedAt: null,
      resumeMimeType: '',
      resumeSize: 0,
    },
  })

  return sanitizeUser(updated)
}

export function resolveResumePath(filename) {
  const resolved = path.resolve(UPLOADS_DIR, filename)
  if (!resolved.startsWith(path.resolve(UPLOADS_DIR))) {
    throw new Error('INVALID_PATH')
  }
  return resolved
}
