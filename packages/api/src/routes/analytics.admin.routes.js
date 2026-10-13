import { Router } from 'express'
import { requireStaff, requirePermission } from '../middleware/auth.js'
import {
  getAnalyticsOverview,
  getConversionFunnel,
  getApplicationsByState,
  getStageDurationStats,
  getApplicationsTrend,
  exportAnalyticsReport,
} from '../services/analytics.service.js'
import { logRouteError, buildErrorBody } from '../utils/httpError.js'

const router = Router()

router.use(requireStaff)
router.use(requirePermission('analytics:read'))

const periodQuery = (req) => ({
  period: req.query.period,
  from: req.query.from,
  to: req.query.to,
})

router.get('/analytics/overview', async (req, res) => {
  try {
    const overview = await getAnalyticsOverview(periodQuery(req))
    res.json({ overview })
  } catch (error) {
    logRouteError('analytics/overview', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao carregar visão geral.',
    })
    res.status(statusCode).json(body)
  }
})

router.get('/analytics/funnel', async (req, res) => {
  try {
    const funnel = await getConversionFunnel(periodQuery(req))
    res.json({ funnel })
  } catch (error) {
    logRouteError('analytics/funnel', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao carregar funil.',
    })
    res.status(statusCode).json(body)
  }
})

router.get('/analytics/by-state', async (req, res) => {
  try {
    const data = await getApplicationsByState(periodQuery(req))
    res.json(data)
  } catch (error) {
    logRouteError('analytics/by-state', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao carregar dados por estado.',
    })
    res.status(statusCode).json(body)
  }
})

router.get('/analytics/stage-duration', async (req, res) => {
  try {
    const data = await getStageDurationStats(periodQuery(req))
    res.json(data)
  } catch (error) {
    logRouteError('analytics/stage-duration', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao carregar tempo por etapa.',
    })
    res.status(statusCode).json(body)
  }
})

router.get('/analytics/trend', async (req, res) => {
  try {
    const trend = await getApplicationsTrend(periodQuery(req))
    res.json({ trend })
  } catch (error) {
    logRouteError('analytics/trend', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao carregar tendência.',
    })
    res.status(statusCode).json(body)
  }
})

router.get('/analytics/export', async (req, res) => {
  try {
    const report = req.query.report
    if (!report) {
      return res.status(400).json({ error: 'VALIDATION', message: 'Informe o tipo de relatório.' })
    }

    const exported = await exportAnalyticsReport(report, periodQuery(req))
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`)
    res.send(`\uFEFF${exported.content}`)
  } catch (error) {
    if (error.message === 'INVALID_REPORT') {
      return res.status(400).json({ error: error.message, message: 'Relatório inválido.' })
    }
    logRouteError('analytics/export', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao exportar relatório.',
    })
    res.status(statusCode).json(body)
  }
})

export default router
