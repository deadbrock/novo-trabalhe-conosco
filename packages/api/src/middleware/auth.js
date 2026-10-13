import { verifyToken, getCandidateById, getStaffById } from '../services/auth.service.js'

export function requireAuth(types = ['candidate']) {
  return async (req, res, next) => {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token não informado.' })
    }

    try {
      const token = header.slice(7)
      const payload = verifyToken(token)

      if (!types.includes(payload.type)) {
        return res.status(403).json({ error: 'FORBIDDEN', message: 'Acesso não permitido.' })
      }

      const user = payload.type === 'staff'
        ? await getStaffById(payload.sub)
        : await getCandidateById(payload.sub)

      if (!user) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Usuário não encontrado.' })
      }

      req.user = user
      req.tokenPayload = payload
      req.token = token
      next()
    } catch {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token inválido ou expirado.' })
    }
  }
}

export const requireCandidate = requireAuth(['candidate'])
export const requireStaff = requireAuth(['staff'])

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Esta ação é restrita a administradores.',
    })
  }
  next()
}

export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.tokenPayload || req.tokenPayload.type !== 'staff') {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Acesso restrito.' })
    }

    const permissions = req.tokenPayload.permissions || []
    const [module, action] = permission.split(':')

    const allowed =
      permissions.includes(`${module}:${action}`) ||
      permissions.includes(`${module}:*`) ||
      permissions.includes('*:*') ||
      req.tokenPayload.role === 'admin'

    if (!allowed) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Permissão insuficiente.' })
    }

    next()
  }
}
