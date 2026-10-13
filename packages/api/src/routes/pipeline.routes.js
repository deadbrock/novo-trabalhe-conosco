import { Router } from 'express'
import { requireStaff, requirePermission } from '../middleware/auth.js'
import {
  getPipelineBoard,
  listPipelineStages,
  listPipelineStagesForConfig,
  moveApplicationStage,
  updatePipelineStages,
  getApplicationDetail,
} from '../services/pipeline.service.js'
import { getClientIp } from '../services/audit.service.js'

const router = Router()

router.use(requireStaff)

router.get('/pipeline/board', requirePermission('pipeline:read'), async (req, res) => {
  try {
    const board = await getPipelineBoard({
      jobId: req.query.jobId,
      search: req.query.search,
    }, req.user)
    res.json(board)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao carregar pipeline.' })
  }
})

router.get('/pipeline/stages', requirePermission('pipeline:read'), async (_req, res) => {
  try {
    const stages = await listPipelineStages()
    res.json({ stages })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao listar etapas.' })
  }
})

router.get('/pipeline/stages/config', requirePermission('pipeline:write'), async (_req, res) => {
  try {
    const stages = await listPipelineStagesForConfig()
    res.json({ stages })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao carregar configuração.' })
  }
})

router.put('/pipeline/stages', requirePermission('pipeline:write'), async (req, res) => {
  try {
    const { stages } = req.body
    if (!Array.isArray(stages) || stages.length === 0) {
      return res.status(400).json({ error: 'VALIDATION', message: 'Informe as etapas do pipeline.' })
    }

    const updated = await updatePipelineStages(stages, req.user.id, { ipAddress: getClientIp(req) })
    res.json({ stages: updated, message: 'Etapas atualizadas.' })
  } catch (error) {
    if (error.message === 'INVALID_STAGE') {
      return res.status(400).json({ error: error.message, message: 'Etapa inválida.' })
    }
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao salvar etapas.' })
  }
})

router.patch('/pipeline/applications/:id/stage', requirePermission('pipeline:write'), async (req, res) => {
  try {
    const { stageSlug } = req.body
    if (!stageSlug) {
      return res.status(400).json({ error: 'VALIDATION', message: 'Informe a etapa de destino.' })
    }

    const application = await moveApplicationStage(
      req.params.id,
      stageSlug,
      req.user.id,
      { ipAddress: getClientIp(req) },
    )
    res.json({ application, message: 'Candidato movido com sucesso.' })
  } catch (error) {
    if (error.message === 'INVALID_STAGE') {
      return res.status(400).json({ error: error.message, message: 'Etapa inválida.' })
    }
    if (error.message === 'APPLICATION_NOT_FOUND') {
      return res.status(404).json({ error: error.message, message: 'Candidatura não encontrada.' })
    }
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao mover candidato.' })
  }
})

router.get('/pipeline/applications/:id', requirePermission('pipeline:read'), async (req, res) => {
  const application = await getApplicationDetail(req.params.id)
  if (!application) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Candidatura não encontrada.' })
  }
  res.json({ application })
})

export default router
