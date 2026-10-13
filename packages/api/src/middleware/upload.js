import multer from 'multer'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { ALLOWED_MIME, DOCUMENTATION_MIME } from '../services/resume.service.js'
import { AVATAR_MIME } from '../services/avatar.service.js'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_AVATAR_SIZE = 2 * 1024 * 1024

const tempDir = path.join(os.tmpdir(), 'fg-careers-uploads')

function ensureTempDir() {
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }
}

ensureTempDir()

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    try {
      ensureTempDir()
      cb(null, tempDir)
    } catch (error) {
      cb(error)
    }
  },
  filename(_req, file, cb) {
    const ext = ALLOWED_MIME[file.mimetype] || path.extname(file.originalname)
    cb(null, `upload-${Date.now()}${ext}`)
  },
})

const avatarStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    try {
      ensureTempDir()
      cb(null, tempDir)
    } catch (error) {
      cb(error)
    }
  },
  filename(_req, file, cb) {
    const ext = AVATAR_MIME[file.mimetype] || path.extname(file.originalname) || '.jpg'
    cb(null, `avatar-${Date.now()}${ext}`)
  },
})

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIME[file.mimetype]) {
    cb(null, true)
    return
  }
  cb(new Error('INVALID_FILE_TYPE'))
}

function avatarFileFilter(_req, file, cb) {
  if (AVATAR_MIME[file.mimetype]) {
    cb(null, true)
    return
  }
  cb(new Error('INVALID_AVATAR_TYPE'))
}

function documentationFileFilter(_req, file, cb) {
  if (DOCUMENTATION_MIME[file.mimetype]) {
    cb(null, true)
    return
  }
  cb(new Error('INVALID_FILE_TYPE'))
}

export const documentationUpload = multer({
  storage,
  fileFilter: documentationFileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
})

export const resumeUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
})

export const talentPoolUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
})

export const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: { fileSize: MAX_AVATAR_SIZE },
})

export { MAX_FILE_SIZE, MAX_AVATAR_SIZE, tempDir }
