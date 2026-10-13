import { Router } from 'express'
import { requireStaff, requirePermission } from '../middleware/auth.js'
import { getClientIp } from '../services/audit.service.js'
import {
  createInterviewAdmin,
  deleteInterviewAdmin,
  getInterviewAdmin,
  getInterviewStats,
  listInterviewCandidateOptions,
  listInterviewApplicationOptions,
  listInterviewsAdmin,
  updateInterviewAdmin,
  sendInterviewToDocumentation,
} from '../services/interviews.service.js'
import { logRouteError, buildErrorBody } from '../utils/httpError.js'

const router = Router()

router.use(requireStaff)

router.get('/interviews/stats', requirePermission('interviews:read'), async (_req, res) => {
  try {
    const stats = await getInterviewStats()
    res.json({ stats })
  } catch (error) {
    logRouteError('interviews/stats', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao carregar estatísticas de entrevistas.',
    })
    res.status(statusCode).json(body)
  }
})

router.get('/interviews/candidates', requirePermission('interviews:read'), async (_req, res) => {
  try {
    const candidates = await listInterviewCandidateOptions()
    res.json({ candidates })
  } catch (error) {
    logRouteError('interviews/candidates', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao listar candidatos elegíveis.',
    })
    res.status(statusCode).json(body)
  }
})

router.get('/interviews/applications', requirePermission('interviews:read'), async (_req, res) => {
  try {
    const candidates = await listInterviewCandidateOptions()
    res.json({ applications: candidates, candidates })
  } catch (error) {
    logRouteError('interviews/applications', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao listar candidatos elegíveis.',
    })
    res.status(statusCode).json(body)
  }
})

router.get('/interviews', requirePermission('interviews:read'), async (req, res) => {
  try {
    const interviews = await listInterviewsAdmin({
      search: req.query.search,
      status: req.query.status,
      period: req.query.period,
      from: req.query.from,
      to: req.query.to,
    })
    res.json({ interviews })
  } catch (error) {
    logRouteError('interviews/list', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao listar entrevistas.',
    })
    res.status(statusCode).json(body)
  }
})

router.get('/interviews/:id', requirePermission('interviews:read'), async (req, res) => {
  const interview = await getInterviewAdmin(req.params.id)
  if (!interview) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Entrevista não encontrada.' })
  }
  res.json({ interview })
})

router.post('/interviews', requirePermission('interviews:write'), async (req, res) => {
  try {
    const interview = await createInterviewAdmin(req.body, req.user.id, {
      ipAddress: getClientIp(req),
    })
    res.status(201).json({ interview })
  } catch (error) {
    if (error.message === 'VALIDATION') {
      return res.status(400).json({ error: 'VALIDATION', message: 'Preencha candidatura e data/hora.' })
    }
    if (error.message === 'APPLICATION_NOT_FOUND') {
      return res.status(404).json({ error: error.message, message: 'Candidato não encontrado.' })
    }
    if (error.message === 'NOT_ELIGIBLE_FOR_INTERVIEW') {
      return res.status(400).json({
        error: error.message,
        message: 'Somente candidatos na etapa Entrevista do pipeline podem ser agendados.',
      })
    }
    if (error.message === 'INVALID_DATE') {
      return res.status(400).json({ error: error.message, message: 'Data/hora inválida.' })
    }
    logRouteError('interviews/create', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao agendar entrevista.',
    })
    res.status(statusCode).json(body)
  }
})

router.put('/interviews/:id', requirePermission('interviews:write'), async (req, res) => {
  try {
    const interview = await updateInterviewAdmin(req.params.id, req.body, req.user.id, {
      ipAddress: getClientIp(req),
    })
    res.json({ interview })
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Entrevista não encontrada.' })
    }
    if (error.message === 'INVALID_DATE') {
      return res.status(400).json({ error: error.message, message: 'Data/hora inválida.' })
    }
    logRouteError('interviews/update', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao atualizar entrevista.',
    })
    res.status(statusCode).json(body)
  }
})

router.post('/interviews/:id/send-to-documentation', requirePermission('interviews:write'), async (req, res) => {
  try {
    const interview = await sendInterviewToDocumentation(req.params.id, req.user.id, {
      ipAddress: getClientIp(req),
    })
    res.json({ interview, message: 'Candidato enviado para a etapa Documentação.' })
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Entrevista não encontrada.' })
    }
    if (error.message === 'ALREADY_SENT') {
      return res.status(409).json({ error: error.message, message: 'Este candidato já foi enviado para documentação.' })
    }
    if (error.message === 'INVALID_STAGE') {
      return res.status(400).json({
        error: error.message,
        message: 'O candidato precisa estar na etapa Entrevista do pipeline.',
      })
    }
    logRouteError('interviews/send-to-documentation', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao enviar candidato para documentação.',
    })
    res.status(statusCode).json(body)
  }
})

router.delete('/interviews/:id', requirePermission('interviews:write'), async (req, res) => {
  try {
    await deleteInterviewAdmin(req.params.id, req.user.id, { ipAddress: getClientIp(req) })
    res.json({ message: 'Entrevista removida.' })
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Entrevista não encontrada.' })
    }
    logRouteError('interviews/delete', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao remover entrevista.',
    })
    res.status(statusCode).json(body)
  }
})

export default router
