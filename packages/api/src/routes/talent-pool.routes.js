import { Router } from 'express'
import fs from 'node:fs'
import { talentPoolUpload } from '../middleware/upload.js'
import { submitTalentPoolEntry } from '../services/talentPool.service.js'
import { getClientIp } from '../services/audit.service.js'
import { buildErrorBody, logRouteError } from '../utils/httpError.js'

const router = Router()

router.post('/', (req, res) => {
  talentPoolUpload.single('resume')(req, res, async (err) => {
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
      logRouteError('talent-pool/upload', err)
      const uploadMessage =
        err.message?.includes('UPLOAD_TEMP_MISSING')
          ? 'Falha ao processar currículo enviado. Tente enviar o arquivo novamente.'
          : 'Erro ao receber currículo.'
      const { statusCode, body } = buildErrorBody(err, {
        errorCode: 'UPLOAD_ERROR',
        message: uploadMessage,
      })
      return res.status(statusCode).json(body)
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
      const entry = await submitTalentPoolEntry(
        {
          data: { name, email, phone, area, areaLabel, desiredJob, desiredJobSlug, linkedin, message },
          file: req.file,
        },
        { ipAddress: getClientIp(req) },
      )

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

      logRouteError('talent-pool/submit', error, { email })
      const { statusCode, body } = buildErrorBody(error, {
        errorCode: 'INTERNAL_ERROR',
        message: 'Erro ao salvar cadastro no banco de talentos.',
      })
      return res.status(statusCode).json(body)
    }
  })
})

export default router
