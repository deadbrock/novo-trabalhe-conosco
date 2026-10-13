import { Router } from 'express'
import {
  registerCandidate,
  verifyEmail,
  resendVerification,
  loginCandidate,
} from '../services/auth.service.js'
import { getClientIp } from '../services/audit.service.js'

const router = Router()

const errorMap = {
  TERMS_REQUIRED: { status: 400, message: 'É necessário aceitar os termos de uso.' },
  EMAIL_IN_USE: { status: 409, message: 'Este e-mail já está cadastrado.' },
  INVALID_TOKEN: { status: 400, message: 'Link de verificação inválido.' },
  TOKEN_EXPIRED: { status: 400, message: 'Link de verificação expirado. Solicite um novo e-mail.' },
  USER_NOT_FOUND: { status: 404, message: 'Usuário não encontrado.' },
  ALREADY_VERIFIED: { status: 400, message: 'E-mail já verificado.' },
  INVALID_CREDENTIALS: { status: 401, message: 'E-mail ou senha incorretos.' },
  EMAIL_NOT_VERIFIED: {
    status: 403,
    message: 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.',
  },
}

function handleError(res, error) {
  const mapped = errorMap[error.message]
  if (mapped) {
    return res.status(mapped.status).json({ error: error.message, message: mapped.message })
  }
  console.error(error)
  return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' })
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, acceptTerms } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'VALIDATION', message: 'Preencha todos os campos obrigatórios.' })
    }
    const result = await registerCandidate(
      { name, email, password, phone, acceptTerms },
      { ipAddress: getClientIp(req) },
    )
    return res.status(201).json({
      message: result.message || 'Conta criada! Verifique seu e-mail para ativar o acesso.',
      user: result.user,
      verifyUrl: result.verifyUrl,
      emailSent: result.emailSent,
      emailError: result.emailError,
    })
  } catch (error) {
    return handleError(res, error)
  }
})

router.get('/verify-email/:token', async (req, res) => {
  try {
    const user = await verifyEmail(req.params.token, { ipAddress: getClientIp(req) })
    return res.json({ message: 'E-mail confirmado com sucesso!', user })
  } catch (error) {
    return handleError(res, error)
  }
})

router.post('/resend-verification', async (req, res) => {
  try {
    const result = await resendVerification(req.body.email)
    return res.json(result)
  } catch (error) {
    return handleError(res, error)
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'VALIDATION', message: 'Informe e-mail e senha.' })
    }
    const result = await loginCandidate({ email, password }, { ipAddress: getClientIp(req) })
    return res.json(result)
  } catch (error) {
    return handleError(res, error)
  }
})

export default router
