import multer from 'multer'
import path from 'node:path'
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  UPLOADS_DIR,
  ensureUploadsDir,
} from '../config/uploads.js'

ensureUploadsDir()

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOADS_DIR)
  },
  filename(req, file, cb) {
    const ext = ALLOWED_MIME_TYPES[file.mimetype] || path.extname(file.originalname)
    const safeName = `${req.user.id}-${Date.now()}${ext}`
    cb(null, safeName)
  },
})

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIME_TYPES[file.mimetype]) {
    cb(null, true)
    return
  }
  cb(new Error('INVALID_FILE_TYPE'))
}

export const resumeUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
})
