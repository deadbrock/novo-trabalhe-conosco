import { Router } from 'express'
import { requireStaff, requirePermission, requireAdmin } from '../middleware/auth.js'
import {
  listStaffUsers,
  listRoles,
  listAssignableRoles,
  createStaffUser,
  updateStaffUser,
  getIntegrationsStatus,
  listAuditLogs,
} from '../services/settings.service.js'
import { getClientIp } from '../services/audit.service.js'
import { logRouteError, buildErrorBody } from '../utils/httpError.js'

const router = Router()

router.use(requireStaff)
router.use(requirePermission('settings:read'))

router.get('/settings/users', requireAdmin, async (_req, res) => {
  try {
    const users = await listStaffUsers()
    res.json({ users })
  } catch (error) {
    logRouteError('settings/users', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao listar usuários.',
    })
    res.status(statusCode).json(body)
  }
})

router.post('/settings/users', requireAdmin, async (req, res) => {
  try {
    const user = await createStaffUser(req.body, req.user.id, { ipAddress: getClientIp(req) })
    res.status(201).json({ user, message: 'Usuário criado com sucesso.' })
  } catch (error) {
    const messages = {
      VALIDATION: 'Informe nome, e-mail, senha e perfil de acesso.',
      WEAK_PASSWORD: 'A senha deve ter pelo menos 8 caracteres.',
      EMAIL_IN_USE: 'Este e-mail já está em uso.',
      ROLE_NOT_FOUND: 'Perfil de acesso inválido.',
    }
    if (messages[error.message]) {
      return res.status(400).json({ error: error.message, message: messages[error.message] })
    }
    logRouteError('settings/users/create', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao criar usuário.',
    })
    res.status(statusCode).json(body)
  }
})

router.get('/settings/roles', async (_req, res) => {
  try {
    const roles = await listRoles()
    res.json({ roles })
  } catch (error) {
    logRouteError('settings/roles', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao listar papéis.',
    })
    res.status(statusCode).json(body)
  }
})

router.get('/settings/roles/assignable', requireAdmin, async (_req, res) => {
  try {
    const roles = await listAssignableRoles()
    res.json({ roles })
  } catch (error) {
    logRouteError('settings/roles/assignable', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao listar perfis.',
    })
    res.status(statusCode).json(body)
  }
})

router.put('/settings/users/:id', requireAdmin, async (req, res) => {
  try {
    const user = await updateStaffUser(
      req.params.id,
      req.body,
      req.user.id,
      { ipAddress: getClientIp(req) },
    )
    res.json({ user, message: 'Usuário atualizado.' })
  } catch (error) {
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: error.message, message: 'Usuário não encontrado.' })
    }
    if (error.message === 'ROLE_NOT_FOUND') {
      return res.status(400).json({ error: error.message, message: 'Perfil inválido.' })
    }
    logRouteError('settings/users/update', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao atualizar usuário.',
    })
    res.status(statusCode).json(body)
  }
})

router.get('/settings/integrations', requireAdmin, async (_req, res) => {
  try {
    const integrations = await getIntegrationsStatus()
    res.json({ integrations })
  } catch (error) {
    logRouteError('settings/integrations', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao carregar integrações.',
    })
    res.status(statusCode).json(body)
  }
})

router.get('/settings/audit-log', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50
    const offset = Number(req.query.offset) || 0
    const data = await listAuditLogs({ limit, offset })
    res.json(data)
  } catch (error) {
    logRouteError('settings/audit-log', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao carregar registro de auditoria.',
    })
    res.status(statusCode).json(body)
  }
})

export default router
