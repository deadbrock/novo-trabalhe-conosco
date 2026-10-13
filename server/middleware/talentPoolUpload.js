import multer from 'multer'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  TALENT_POOL_UPLOADS_DIR,
  ensureUploadsDir,
} from '../config/uploads.js'

ensureUploadsDir()

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, TALENT_POOL_UPLOADS_DIR)
  },
  filename(_req, file, cb) {
    const ext = ALLOWED_MIME_TYPES[file.mimetype] || path.extname(file.originalname)
    cb(null, `talent-${randomUUID()}${ext}`)
  },
})

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIME_TYPES[file.mimetype]) {
    cb(null, true)
    return
  }
  cb(new Error('INVALID_FILE_TYPE'))
}

export const talentPoolUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
})
