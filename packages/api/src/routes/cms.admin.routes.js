import { Router } from 'express'
import { requireStaff, requirePermission } from '../middleware/auth.js'
import {
  listCmsSections,
  getCmsSectionForEdit,
  saveCmsDraft,
  publishCmsSection,
} from '../services/cms.service.js'
import { getClientIp } from '../services/audit.service.js'
import { logRouteError, buildErrorBody } from '../utils/httpError.js'

const router = Router()

router.use(requireStaff)

router.get('/cms/sections', requirePermission('cms:read'), async (_req, res) => {
  try {
    const sections = await listCmsSections()
    res.json({ sections })
  } catch (error) {
    logRouteError('cms/sections/list', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao listar seções do CMS.',
    })
    res.status(statusCode).json(body)
  }
})

router.get('/cms/sections/:slug', requirePermission('cms:read'), async (req, res) => {
  try {
    const section = await getCmsSectionForEdit(req.params.slug)
    res.json({ section })
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Seção não encontrada.' })
    }
    logRouteError('cms/sections/get', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao carregar seção.',
    })
    res.status(statusCode).json(body)
  }
})

router.put('/cms/sections/:slug/draft', requirePermission('cms:write'), async (req, res) => {
  try {
    const section = await saveCmsDraft(
      req.params.slug,
      req.body.payload,
      req.user.id,
      { ipAddress: getClientIp(req) },
    )
    res.json({ section, message: 'Rascunho salvo.' })
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Seção não encontrada.' })
    }
    if (error.message === 'VALIDATION') {
      return res.status(400).json({ error: 'VALIDATION', message: 'Payload JSON inválido.' })
    }
    logRouteError('cms/sections/draft', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao salvar rascunho.',
    })
    res.status(statusCode).json(body)
  }
})

router.post('/cms/sections/:slug/publish', requirePermission('cms:publish'), async (req, res) => {
  try {
    if (req.body.payload) {
      await saveCmsDraft(
        req.params.slug,
        req.body.payload,
        req.user.id,
        { ipAddress: getClientIp(req) },
      )
    }

    const section = await publishCmsSection(
      req.params.slug,
      req.user.id,
      { ipAddress: getClientIp(req) },
    )
    res.json({ section, message: 'Conteúdo publicado no website.' })
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Seção não encontrada.' })
    }
    if (error.message === 'NO_DRAFT') {
      return res.status(400).json({
        error: error.message,
        message: 'Salve um rascunho antes de publicar.',
      })
    }
    logRouteError('cms/sections/publish', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao publicar conteúdo.',
    })
    res.status(statusCode).json(body)
  }
})

export default router
