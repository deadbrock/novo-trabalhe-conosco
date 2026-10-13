import { Router } from 'express'
import { requireStaff, requirePermission } from '../middleware/auth.js'
import { loginStaff, getStaffById, refreshStaffSession, logoutStaff, verifyToken } from '../services/auth.service.js'
import { getDashboardOverview, getRecentActivities } from '../services/dashboard.service.js'
import { listDocumentationReviewNotifications } from '../services/documentationNotifications.service.js'
import { getConversionFunnel, getApplicationsByState } from '../services/analytics.service.js'
import { getClientIp } from '../services/audit.service.js'

const router = Router()

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'VALIDATION', message: 'Informe e-mail e senha.' })
    }
    const result = await loginStaff({ email, password }, { ipAddress: getClientIp(req) })
    return res.json(result)
  } catch (error) {
    if (['INVALID_CREDENTIALS', 'ACCOUNT_INACTIVE'].includes(error.message)) {
      const messages = {
        INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
        ACCOUNT_INACTIVE: 'Conta inativa. Contate o administrador.',
      }
      return res.status(401).json({ error: error.message, message: messages[error.message] })
    }
    console.error(error)
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' })
  }
})

router.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.status(400).json({ error: 'VALIDATION', message: 'Refresh token não informado.' })
    }
    const result = await refreshStaffSession(refreshToken, { ipAddress: getClientIp(req) })
    return res.json(result)
  } catch (error) {
    if (error.message === 'INVALID_REFRESH_TOKEN') {
      return res.status(401).json({ error: error.message, message: 'Sessão expirada. Faça login novamente.' })
    }
    console.error(error)
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' })
  }
})

router.post('/auth/logout', async (req, res) => {
  try {
    let userId = null
    const header = req.headers.authorization
    if (header?.startsWith('Bearer ')) {
      try {
        const payload = verifyToken(header.slice(7))
        if (payload.type === 'staff') userId = payload.sub
      } catch {
        /* token expirado */
      }
    }

    await logoutStaff(req.body?.refreshToken, userId, { ipAddress: getClientIp(req) })
    return res.json({ message: 'Logout realizado com sucesso.' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao encerrar sessão.' })
  }
})

router.get('/me', requireStaff, async (req, res) => {
  const user = await getStaffById(req.user.id)
  res.json({ user })
})

router.get('/dashboard', requireStaff, requirePermission('dashboard:read'), async (_req, res) => {
  const stats = await getDashboardOverview()
  res.json({ stats })
})

router.get('/dashboard/activities', requireStaff, requirePermission('dashboard:read'), async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 12, 50)
  const since = req.query.since || undefined
  const activities = await getRecentActivities(limit, since)
  res.json({ activities })
})

router.get('/dashboard/funnel', requireStaff, requirePermission('dashboard:read'), async (_req, res) => {
  const funnel = await getConversionFunnel({ period: 'all' })
  res.json({ funnel })
})

router.get('/dashboard/by-state', requireStaff, requirePermission('dashboard:read'), async (_req, res) => {
  const data = await getApplicationsByState({ period: '30d' })
  res.json(data)
})

router.get('/notifications', requireStaff, requirePermission('candidates:read'), async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 15, 50)
  const notifications = await listDocumentationReviewNotifications(limit)
  res.json({
    notifications,
    unreadCount: notifications.length,
  })
})

export default router
