import { storageService } from '../../storage/index.js'
import {
  candidateStorageDir,
  certificateFileName,
  signedPdfFileName,
} from './documentRegistry.js'

export async function saveCandidateDocumentFile(candidateId, fileBaseName, buffer, { certificate = false } = {}) {
  const fileName = certificate ? certificateFileName(fileBaseName) : signedPdfFileName(fileBaseName)
  const directory = candidateStorageDir(candidateId)

  const stored = await storageService.upload(
    {
      buffer,
      mimetype: 'application/pdf',
      originalname: fileName,
      size: buffer.length,
    },
    { key: fileName, directory },
  )

  return {
    storageKey: stored.key,
    fileName,
    size: buffer.length,
  }
}

export async function streamCandidateDocumentFile(storageKey) {
  if (!storageKey) throw new Error('FILE_NOT_FOUND')
  return storageService.download(storageKey)
}

export async function deleteCandidateDocumentFile(storageKey) {
  if (!storageKey) return
  await storageService.delete(storageKey).catch(() => {})
}
