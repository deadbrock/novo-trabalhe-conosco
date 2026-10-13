import { Router } from 'express'
import { requireStaff, requirePermission } from '../middleware/auth.js'
import { getClientIp } from '../services/audit.service.js'
import {
  createMessageTemplate,
  deleteMessageTemplate,
  getCommunicationStats,
  listCommunicationLogs,
  listMessageTemplates,
  previewCommunication,
  sendCommunication,
  updateMessageTemplate,
} from '../services/communication.service.js'
import { logRouteError, buildErrorBody } from '../utils/httpError.js'

const router = Router()

router.use(requireStaff)

router.get('/communication/stats', requirePermission('communication:read'), async (_req, res) => {
  try {
    const stats = await getCommunicationStats()
    res.json({ stats })
  } catch (error) {
    logRouteError('communication/stats', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao carregar estatísticas.',
    })
    res.status(statusCode).json(body)
  }
})

router.get('/communication/templates', requirePermission('communication:read'), async (_req, res) => {
  try {
    const templates = await listMessageTemplates()
    res.json({ templates })
  } catch (error) {
    logRouteError('communication/templates', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao listar modelos.',
    })
    res.status(statusCode).json(body)
  }
})

router.post('/communication/templates', requirePermission('communication:write'), async (req, res) => {
  try {
    const template = await createMessageTemplate(req.body, req.user.id, {
      ipAddress: getClientIp(req),
    })
    res.status(201).json({ template })
  } catch (error) {
    if (error.message === 'VALIDATION') {
      return res.status(400).json({ error: 'VALIDATION', message: 'Preencha nome, canal e conteúdo.' })
    }
    logRouteError('communication/templates/create', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao criar modelo.',
    })
    res.status(statusCode).json(body)
  }
})

router.put('/communication/templates/:id', requirePermission('communication:write'), async (req, res) => {
  try {
    const template = await updateMessageTemplate(req.params.id, req.body, req.user.id, {
      ipAddress: getClientIp(req),
    })
    res.json({ template })
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Modelo não encontrado.' })
    }
    logRouteError('communication/templates/update', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao atualizar modelo.',
    })
    res.status(statusCode).json(body)
  }
})

router.delete('/communication/templates/:id', requirePermission('communication:write'), async (req, res) => {
  try {
    await deleteMessageTemplate(req.params.id, req.user.id, { ipAddress: getClientIp(req) })
    res.json({ message: 'Modelo removido.' })
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Modelo não encontrado.' })
    }
    logRouteError('communication/templates/delete', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao remover modelo.',
    })
    res.status(statusCode).json(body)
  }
})

router.get('/communication/logs', requirePermission('communication:read'), async (req, res) => {
  try {
    const logs = await listCommunicationLogs({
      channel: req.query.channel,
      status: req.query.status,
    })
    res.json({ logs })
  } catch (error) {
    logRouteError('communication/logs', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao listar histórico.',
    })
    res.status(statusCode).json(body)
  }
})

router.post('/communication/preview', requirePermission('communication:read'), async (req, res) => {
  try {
    const preview = await previewCommunication(req.body)
    res.json({ preview })
  } catch (error) {
    if (error.message === 'VALIDATION') {
      return res.status(400).json({ error: 'VALIDATION', message: 'Selecione candidato ou candidatura.' })
    }
    if (error.message === 'APPLICATION_NOT_FOUND' || error.message === 'CANDIDATE_NOT_FOUND') {
      return res.status(404).json({ error: error.message, message: 'Destinatário não encontrado.' })
    }
    logRouteError('communication/preview', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao gerar pré-visualização.',
    })
    res.status(statusCode).json(body)
  }
})

router.post('/communication/send', requirePermission('communication:write'), async (req, res) => {
  try {
    const log = await sendCommunication(req.body, req.user.id, { ipAddress: getClientIp(req) })
    res.status(201).json({ log })
  } catch (error) {
    if (error.message === 'VALIDATION') {
      return res.status(400).json({ error: 'VALIDATION', message: 'Preencha canal, destinatário e conteúdo.' })
    }
    if (error.message === 'TEMPLATE_NOT_FOUND') {
      return res.status(404).json({ error: error.message, message: 'Modelo não encontrado.' })
    }
    if (error.message === 'APPLICATION_NOT_FOUND' || error.message === 'CANDIDATE_NOT_FOUND') {
      return res.status(404).json({ error: error.message, message: 'Destinatário não encontrado.' })
    }
    logRouteError('communication/send', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: error.message || 'Erro ao enviar comunicação.',
    })
    res.status(statusCode).json(body)
  }
})

export default router
