import { verifyToken, getCandidateById } from '../services/auth.service.js'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token não informado.' })
  }

  try {
    const token = header.slice(7)
    const payload = verifyToken(token)
    const user = getCandidateById(payload.sub)

    if (!user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Usuário não encontrado.' })
    }

    req.user = user
    req.token = token
    next()
  } catch {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token inválido ou expirado.' })
  }
}
