import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { resumeUpload } from '../middleware/resumeUpload.js'
import { updateCandidateProfile } from '../services/auth.service.js'
import {
  saveUserResume,
  getUserResumeFile,
  removeUserResume,
} from '../services/resume.service.js'
import { getApplicationsByUserId } from '../storage/database.js'
import fs from 'node:fs'

const router = Router()

router.use(requireAuth)

function profileCompleteScore(user) {
  const profile = user.profile || {}
  const fields = [
    profile.city,
    profile.state,
    profile.summary,
    profile.linkedin,
    user.phone,
    profile.resumeFileName,
  ]
  const filled = fields.filter(Boolean).length
  return Math.round((filled / fields.length) * 100)
}

router.get('/me', (req, res) => {
  res.json({ user: req.user })
})

router.put('/profile', (req, res) => {
  try {
    const user = updateCandidateProfile(req.user.id, req.body)
    res.json({ user })
  } catch (error) {
    res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Usuário não encontrado.' })
  }
})

router.post('/resume', (req, res) => {
  resumeUpload.single('resume')(req, res, (err) => {
    if (err) {
      if (err.message === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          error: 'INVALID_FILE_TYPE',
          message: 'Formato inválido. Envie PDF, DOC ou DOCX.',
        })
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'FILE_TOO_LARGE',
          message: 'Arquivo muito grande. Tamanho máximo: 5MB.',
        })
      }
      console.error(err)
      return res.status(500).json({ error: 'UPLOAD_ERROR', message: 'Erro ao enviar currículo.' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'NO_FILE', message: 'Selecione um arquivo para enviar.' })
    }

    try {
      const user = saveUserResume(req.user.id, req.file)
      return res.json({
        message: 'Currículo enviado com sucesso.',
        user,
      })
    } catch (error) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path)
      }
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Usuário não encontrado.' })
    }
  })
})

router.get('/resume', (req, res) => {
  const resume = getUserResumeFile(req.user.id)
  if (!resume) {
    return res.status(404).json({ error: 'NO_RESUME', message: 'Nenhum currículo encontrado.' })
  }

  res.setHeader('Content-Type', resume.mimeType)
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(resume.originalName)}"`,
  )

  fs.createReadStream(resume.filePath).pipe(res)
})

router.delete('/resume', (req, res) => {
  try {
    const user = removeUserResume(req.user.id)
    res.json({ message: 'Currículo removido.', user })
  } catch (error) {
    res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Usuário não encontrado.' })
  }
})

router.get('/applications', (req, res) => {
  const applications = getApplicationsByUserId(req.user.id)
  res.json({ applications })
})

router.get('/dashboard', (req, res) => {
  const applications = getApplicationsByUserId(req.user.id)
  const active = applications.filter((a) => !['rejected', 'withdrawn'].includes(a.status))
  const interviews = applications.filter((a) => a.status === 'interview')

  res.json({
    stats: {
      activeApplications: active.length,
      interviews: interviews.length,
      profileComplete: profileCompleteScore(req.user),
    },
    applications: applications.slice(0, 5),
  })
})

export default router
