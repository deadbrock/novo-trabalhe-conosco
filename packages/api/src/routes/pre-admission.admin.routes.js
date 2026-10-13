import { Router } from 'express'
import fs from 'node:fs'
import { requireStaff, requirePermission } from '../middleware/auth.js'
import { getClientIp } from '../services/audit.service.js'
import { resumeUpload } from '../middleware/upload.js'
import {
  forwardPreAdmissionToDp,
  getPreAdmissionCase,
  getPreAdmissionStats,
  listPreAdmissionCases,
  reviewChecklistItem,
  streamChecklistItemDocument,
  uploadChecklistItemDocument,
} from '../services/preAdmission.service.js'
import { logRouteError, buildErrorBody } from '../utils/httpError.js'

const router = Router()

router.use(requireStaff)

router.get('/pre-admission/stats', requirePermission('pre_admission:read'), async (_req, res) => {
  try {
    const stats = await getPreAdmissionStats()
    res.json({ stats })
  } catch (error) {
    logRouteError('pre-admission/stats', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao carregar estatísticas.',
    })
    res.status(statusCode).json(body)
  }
})

router.get('/pre-admission', requirePermission('pre_admission:read'), async (req, res) => {
  try {
    const cases = await listPreAdmissionCases({
      status: req.query.status,
      search: req.query.search,
    })
    res.json({ cases })
  } catch (error) {
    logRouteError('pre-admission/list', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao listar pré-admissões.',
    })
    res.status(statusCode).json(body)
  }
})

router.get('/pre-admission/:id', requirePermission('pre_admission:read'), async (req, res) => {
  try {
    const preAdmissionCase = await getPreAdmissionCase(req.params.id)
    res.json({ case: preAdmissionCase })
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Caso não encontrado.' })
    }
    logRouteError('pre-admission/get', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao carregar caso.',
    })
    res.status(statusCode).json(body)
  }
})

router.post('/pre-admission/:id/forward-to-dp', requirePermission('pre_admission:write'), async (req, res) => {
  try {
    const preAdmissionCase = await forwardPreAdmissionToDp(req.params.id, req.user.id, {
      ipAddress: getClientIp(req),
    })
    res.json({ case: preAdmissionCase, message: 'Candidato encaminhado ao Departamento Pessoal.' })
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Caso não encontrado.' })
    }
    if (error.message === 'ITEMS_NOT_APPROVED') {
      return res.status(400).json({
        error: error.message,
        message: 'Todos os documentos obrigatórios precisam estar aprovados.',
      })
    }
    if (error.message === 'INVALID_STATUS') {
      return res.status(400).json({ error: error.message, message: 'Status inválido para encaminhamento.' })
    }
    logRouteError('pre-admission/forward-to-dp', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao encaminhar ao DP.',
    })
    res.status(statusCode).json(body)
  }
})

router.patch('/pre-admission/:id/items/:itemId/review', requirePermission('pre_admission:write'), async (req, res) => {
  try {
    const { decision, reason } = req.body
    const preAdmissionCase = await reviewChecklistItem(
      req.params.id,
      req.params.itemId,
      decision,
      reason,
      req.user.id,
      { ipAddress: getClientIp(req) },
    )
    res.json({ case: preAdmissionCase })
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Caso não encontrado.' })
    }
    if (error.message === 'ITEM_NOT_FOUND') {
      return res.status(404).json({ error: error.message, message: 'Item não encontrado.' })
    }
    if (error.message === 'ITEM_NOT_UPLOADED') {
      return res.status(400).json({ error: error.message, message: 'Documento ainda não foi enviado.' })
    }
    if (error.message === 'VALIDATION') {
      return res.status(400).json({ error: 'VALIDATION', message: 'Informe o motivo da reprovação.' })
    }
    logRouteError('pre-admission/item/review', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao avaliar documento.',
    })
    res.status(statusCode).json(body)
  }
})

router.post('/pre-admission/:id/items/:itemId/upload', requirePermission('pre_admission:write'), (req, res) => {
  resumeUpload.single('document')(req, res, async (err) => {
    if (err) {
      if (err.message === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ error: 'INVALID_FILE_TYPE', message: 'Formato inválido. Envie PDF, DOC ou DOCX.' })
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'FILE_TOO_LARGE', message: 'Arquivo muito grande. Máximo: 5MB.' })
      }
      logRouteError('pre-admission/item/upload', err)
      return res.status(500).json({ error: 'UPLOAD_ERROR', message: 'Erro ao enviar documento.' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'NO_FILE', message: 'Selecione um arquivo.' })
    }

    try {
      const preAdmissionCase = await uploadChecklistItemDocument(
        req.params.id,
        req.params.itemId,
        req.file,
        req.user.id,
        { ipAddress: getClientIp(req) },
      )
      res.json({ case: preAdmissionCase, message: 'Documento enviado.' })
    } catch (error) {
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path)
      if (error.message === 'NOT_FOUND') {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Caso não encontrado.' })
      }
      if (error.message === 'ITEM_NOT_FOUND') {
        return res.status(404).json({ error: error.message, message: 'Item não encontrado.' })
      }
      logRouteError('pre-admission/item/upload', error)
      const { statusCode, body } = buildErrorBody(error, {
        errorCode: 'INTERNAL_ERROR',
        message: 'Erro ao enviar documento.',
      })
      res.status(statusCode).json(body)
    }
  })
})

router.get('/pre-admission/:id/items/:itemId/document', requirePermission('pre_admission:read'), async (req, res) => {
  try {
    const document = await streamChecklistItemDocument(req.params.id, req.params.itemId)
    const inline = req.query.inline === 'true'
    const disposition = inline ? 'inline' : 'attachment'

    res.setHeader('Content-Type', document.mimeType)
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${encodeURIComponent(document.originalName)}"`,
    )
    document.stream.pipe(res)
  } catch (error) {
    if (error.message === 'NOT_FOUND' || error.message === 'DOCUMENT_NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Documento não encontrado.' })
    }
    logRouteError('pre-admission/item/document', error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao baixar documento.' })
  }
})

export default router
