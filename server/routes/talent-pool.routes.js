import { Router } from 'express'
import fs from 'node:fs'
import { talentPoolUpload } from '../middleware/talentPoolUpload.js'
import { submitTalentPoolEntry } from '../services/talentPool.service.js'

const router = Router()

router.post('/', (req, res) => {
  talentPoolUpload.single('resume')(req, res, (err) => {
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
      return res.status(400).json({
        error: 'NO_FILE',
        message: 'Envie seu currículo para concluir o cadastro.',
      })
    }

    const { name, email, phone, area, areaLabel, desiredJob, desiredJobSlug, linkedin, message } = req.body

    if (!name || !email || !phone || !area || !desiredJob) {
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path)
      return res.status(400).json({
        error: 'VALIDATION',
        message: 'Preencha todos os campos obrigatórios, incluindo a vaga pretendida.',
      })
    }

    try {
      const entry = submitTalentPoolEntry({
        data: { name, email, phone, area, areaLabel, desiredJob, desiredJobSlug, linkedin, message },
        file: req.file,
      })

      return res.status(201).json({
        message: 'Cadastro realizado com sucesso! Entraremos em contato quando houver oportunidades compatíveis.',
        id: entry.id,
      })
    } catch (error) {
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path)

      if (error.message === 'EMAIL_ALREADY_REGISTERED') {
        return res.status(409).json({
          error: 'EMAIL_ALREADY_REGISTERED',
          message: 'Este e-mail já está cadastrado no banco de talentos.',
        })
      }

      console.error(error)
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao processar cadastro.' })
    }
  })
})

export default router
