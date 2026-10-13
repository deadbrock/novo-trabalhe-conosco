import { Router } from 'express'
import { requireStaff, requirePermission } from '../middleware/auth.js'
import { avatarUpload } from '../middleware/upload.js'
import {
  updateStaffProfile,
  changeStaffPassword,
  uploadStaffAvatar,
  removeStaffAvatar,
} from '../services/avatar.service.js'
import { getClientIp } from '../services/audit.service.js'
import { logRouteError, buildErrorBody } from '../utils/httpError.js'

const router = Router()

router.use(requireStaff)

router.put('/me/profile', async (req, res) => {
  try {
    const user = await updateStaffProfile(req.user.id, req.body, { ipAddress: getClientIp(req) })
    res.json({ user, message: 'Perfil atualizado com sucesso.' })
  } catch (error) {
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: error.message, message: 'Usuário não encontrado.' })
    }
    if (error.message === 'VALIDATION') {
      return res.status(400).json({ error: error.message, message: 'Informe ao menos um campo para atualizar.' })
    }
    logRouteError('profile/update', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao atualizar perfil.',
    })
    res.status(statusCode).json(body)
  }
})

router.put('/me/password', async (req, res) => {
  try {
    const result = await changeStaffPassword(req.user.id, req.body, { ipAddress: getClientIp(req) })
    res.json(result)
  } catch (error) {
    const messages = {
      VALIDATION: 'Informe a senha atual e a nova senha.',
      WEAK_PASSWORD: 'A nova senha deve ter pelo menos 8 caracteres.',
      INVALID_PASSWORD: 'Senha atual incorreta.',
      USER_NOT_FOUND: 'Usuário não encontrado.',
    }
    if (messages[error.message]) {
      return res.status(400).json({ error: error.message, message: messages[error.message] })
    }
    logRouteError('profile/password', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao alterar senha.',
    })
    res.status(statusCode).json(body)
  }
})

router.post('/me/avatar', avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'VALIDATION', message: 'Selecione uma imagem (JPG, PNG ou WebP).' })
    }
    const user = await uploadStaffAvatar(req.user.id, req.file, { ipAddress: getClientIp(req) })
    res.json({ user, message: 'Foto atualizada com sucesso.' })
  } catch (error) {
    if (error.message === 'INVALID_AVATAR_TYPE') {
      return res.status(400).json({
        error: error.message,
        message: 'Formato inválido. Use JPG, PNG ou WebP (máx. 2 MB).',
      })
    }
    logRouteError('profile/avatar', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao enviar foto.',
    })
    res.status(statusCode).json(body)
  }
})

router.delete('/me/avatar', async (req, res) => {
  try {
    const user = await removeStaffAvatar(req.user.id, { ipAddress: getClientIp(req) })
    res.json({ user, message: 'Foto removida.' })
  } catch (error) {
    logRouteError('profile/avatar/delete', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao remover foto.',
    })
    res.status(statusCode).json(body)
  }
})

export default router
