import { Router } from 'express'
import { requireStaff, requirePermission } from '../middleware/auth.js'
import {
  getTalentPoolAdmin,
  getTalentPoolStats,
  listTalentPoolAdmin,
  listTalentPoolAreas,
  streamTalentPoolResume,
  updateTalentPoolStatus,
} from '../services/talentPool.service.js'
import { getClientIp } from '../services/audit.service.js'

const router = Router()

router.use(requireStaff)

router.get('/talent-pool/stats', requirePermission('talent_pool:read'), async (_req, res) => {
  try {
    const stats = await getTalentPoolStats()
    res.json({ stats })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao carregar estatísticas.' })
  }
})

router.get('/talent-pool/areas', requirePermission('talent_pool:read'), async (_req, res) => {
  try {
    const areas = await listTalentPoolAreas()
    res.json({ areas })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao listar áreas.' })
  }
})

router.get('/talent-pool', requirePermission('talent_pool:read'), async (req, res) => {
  try {
    const entries = await listTalentPoolAdmin({
      status: req.query.status,
      area: req.query.area,
      search: req.query.search,
    })
    res.json({ entries })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao listar banco de talentos.' })
  }
})

router.get('/talent-pool/:id', requirePermission('talent_pool:read'), async (req, res) => {
  const entry = await getTalentPoolAdmin(req.params.id)
  if (!entry) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Cadastro não encontrado.' })
  }
  res.json({ entry })
})

router.patch('/talent-pool/:id/status', requirePermission('talent_pool:write'), async (req, res) => {
  try {
    const { status } = req.body
    if (!status) {
      return res.status(400).json({ error: 'VALIDATION', message: 'Informe o status.' })
    }

    const entry = await updateTalentPoolStatus(
      req.params.id,
      status,
      req.user.id,
      { ipAddress: getClientIp(req) },
    )
    res.json({ entry, message: 'Status atualizado.' })
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: error.message, message: 'Cadastro não encontrado.' })
    }
    if (error.message === 'INVALID_STATUS') {
      return res.status(400).json({ error: error.message, message: 'Status inválido.' })
    }
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao atualizar status.' })
  }
})

router.get('/talent-pool/:id/resume', requirePermission('talent_pool:read'), async (req, res) => {
  try {
    const resume = await streamTalentPoolResume(req.params.id)
    if (!resume) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Currículo não encontrado.' })
    }

    res.setHeader('Content-Type', resume.mimeType)
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(resume.originalName)}"`,
    )
    resume.stream.pipe(res)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao baixar currículo.' })
  }
})

export default router
