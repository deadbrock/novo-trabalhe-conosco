import { Router } from 'express'
import { requireStaff, requirePermission } from '../middleware/auth.js'
import { getClientIp } from '../services/audit.service.js'
import {
  getPreAdmissionCase,
  getPreAdmissionStats,
  listHrDepartmentCases,
  markPreAdmissionHired,
  reviewHrDepartmentCase,
  streamChecklistItemDocument,
} from '../services/preAdmission.service.js'
import { logRouteError, buildErrorBody } from '../utils/httpError.js'

const router = Router()

router.use(requireStaff)

router.get('/hr-department/stats', requirePermission('hr_department:read'), async (_req, res) => {
  try {
    const stats = await getPreAdmissionStats()
    res.json({
      stats: {
        awaitingDp: stats.awaitingDp,
        approved: stats.approved,
        hired: stats.hired,
        rejected: stats.rejected,
      },
    })
  } catch (error) {
    logRouteError('hr-department/stats', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao carregar estatísticas.',
    })
    res.status(statusCode).json(body)
  }
})

router.get('/hr-department', requirePermission('hr_department:read'), async (req, res) => {
  try {
    const cases = await listHrDepartmentCases({
      status: req.query.status,
      search: req.query.search,
    })
    res.json({ cases })
  } catch (error) {
    logRouteError('hr-department/list', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao listar casos do DP.',
    })
    res.status(statusCode).json(body)
  }
})

router.get('/hr-department/:id', requirePermission('hr_department:read'), async (req, res) => {
  try {
    const preAdmissionCase = await getPreAdmissionCase(req.params.id)
    res.json({ case: preAdmissionCase })
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Caso não encontrado.' })
    }
    logRouteError('hr-department/get', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao carregar caso.',
    })
    res.status(statusCode).json(body)
  }
})

router.patch('/hr-department/:id/review', requirePermission('hr_department:write'), async (req, res) => {
  try {
    const { decision, notes, reason } = req.body
    const preAdmissionCase = await reviewHrDepartmentCase(
      req.params.id,
      decision,
      notes,
      reason,
      req.user.id,
      { ipAddress: getClientIp(req) },
    )
    res.json({
      case: preAdmissionCase,
      message:
        decision === 'approved'
          ? 'Admissão aprovada pelo DP.'
          : decision === 'returned'
            ? 'Caso devolvido ao RH. O relógio do DP foi pausado.'
            : 'Candidato reprovado pelo DP.',
    })
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Caso não encontrado.' })
    }
    if (error.message === 'INVALID_STATUS') {
      return res.status(400).json({ error: error.message, message: 'Caso não está aguardando validação do DP.' })
    }
    if (error.message === 'VALIDATION') {
      return res.status(400).json({ error: 'VALIDATION', message: 'Informe o motivo da devolução.' })
    }
    logRouteError('hr-department/review', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao avaliar admissão.',
    })
    res.status(statusCode).json(body)
  }
})

router.post('/hr-department/:id/hire', requirePermission('hr_department:write'), async (req, res) => {
  try {
    const preAdmissionCase = await markPreAdmissionHired(req.params.id, req.user.id, {
      ipAddress: getClientIp(req),
    })
    res.json({ case: preAdmissionCase, message: 'Candidato marcado como contratado.' })
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Caso não encontrado.' })
    }
    if (error.message === 'INVALID_STATUS') {
      return res.status(400).json({ error: error.message, message: 'Somente casos na fila do DP podem ser concluídos.' })
    }
    logRouteError('hr-department/hire', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao registrar contratação.',
    })
    res.status(statusCode).json(body)
  }
})

router.get('/hr-department/:id/items/:itemId/document', requirePermission('hr_department:read'), async (req, res) => {
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
    logRouteError('hr-department/item/document', error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao baixar documento.' })
  }
})

export default router
