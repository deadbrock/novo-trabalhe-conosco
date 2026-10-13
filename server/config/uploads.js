import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const UPLOADS_DIR = path.join(__dirname, '../data/uploads/resumes')
export const TALENT_POOL_UPLOADS_DIR = path.join(__dirname, '../data/uploads/talent-pool')

export function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }
  if (!fs.existsSync(TALENT_POOL_UPLOADS_DIR)) {
    fs.mkdirSync(TALENT_POOL_UPLOADS_DIR, { recursive: true })
  }
}

export const ALLOWED_MIME_TYPES = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
}

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function deleteResumeFile(filePath) {
  if (!filePath) return
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch (error) {
    console.warn('[Upload] Não foi possível remover arquivo antigo:', error.message)
  }
}
