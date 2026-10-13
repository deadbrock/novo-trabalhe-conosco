import { randomUUID } from 'node:crypto'
import {
  createTalentPoolSubmission,
  findTalentPoolByEmail,
} from '../storage/database.js'

export function submitTalentPoolEntry({ data, file }) {
  const email = data.email.toLowerCase().trim()

  const existing = findTalentPoolByEmail(email)
  if (existing) {
    throw new Error('EMAIL_ALREADY_REGISTERED')
  }

  const entry = createTalentPoolSubmission({
    id: randomUUID(),
    name: data.name.trim(),
    email,
    phone: data.phone.trim(),
    area: data.area,
    areaLabel: data.areaLabel || data.area,
    desiredJob: data.desiredJob.trim(),
    desiredJobSlug: data.desiredJobSlug || '',
    linkedin: data.linkedin?.trim() || '',
    message: data.message?.trim() || '',
    resume: {
      fileName: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      mimeType: file.mimetype,
      size: file.size,
    },
    status: 'pending',
    createdAt: new Date().toISOString(),
  })

  return entry
}
