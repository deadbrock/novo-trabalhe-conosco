import { Router } from 'express'
import { requireStaff, requirePermission } from '../middleware/auth.js'
import {
  listJobsAdmin,
  getJobAdmin,
  createJob,
  updateJob,
  deleteJob,
  publishJob,
  unpublishJob,
} from '../services/jobs.service.js'
import {
  listClients,
  listContracts,
  listDepartments,
  listStates,
  listCities,
} from '../services/catalogs.service.js'
import { listOperationalUnits } from '../services/operationalUnit.service.js'
import { getClientIp } from '../services/audit.service.js'

const router = Router()

router.use(requireStaff)

router.get('/jobs', requirePermission('recruitment:read'), async (req, res) => {
  try {
    const jobs = await listJobsAdmin({
      status: req.query.status,
      clientId: req.query.clientId,
      stateCode: req.query.stateCode,
      search: req.query.search,
    }, req.user)
    res.json({ jobs })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao listar vagas.' })
  }
})

router.get('/jobs/:id', requirePermission('recruitment:read'), async (req, res) => {
  if (req.params.id === 'nova') {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Vaga não encontrada.' })
  }
  const job = await getJobAdmin(req.params.id)
  if (!job) return res.status(404).json({ error: 'NOT_FOUND', message: 'Vaga não encontrada.' })
  res.json({ job })
})

router.post('/jobs', requirePermission('recruitment:write'), async (req, res) => {
  try {
    if (!req.body.title?.trim()) {
      return res.status(400).json({ error: 'VALIDATION', message: 'Informe o título da vaga.' })
    }
    const job = await createJob({ ...req.body, actor: req.user }, req.user.id, { ipAddress: getClientIp(req) })
    res.status(201).json({ job })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao criar vaga.' })
  }
})

router.put('/jobs/:id', requirePermission('recruitment:write'), async (req, res) => {
  try {
    if (req.params.id === 'nova') {
      return res.status(400).json({
        error: 'VALIDATION',
        message: 'Use a criação de vaga para cadastrar uma nova vaga.',
      })
    }
    const job = await updateJob(req.params.id, { ...req.body, actor: req.user }, req.user.id, { ipAddress: getClientIp(req) })
    res.json({ job })
  } catch (error) {
    if (error.message === 'JOB_NOT_FOUND') {
      return res.status(404).json({ error: error.message, message: 'Vaga não encontrada.' })
    }
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao atualizar vaga.' })
  }
})

router.delete('/jobs/:id', requirePermission('recruitment:delete'), async (req, res) => {
  try {
    await deleteJob(req.params.id, req.user.id, { ipAddress: getClientIp(req) })
    res.json({ message: 'Vaga removida.' })
  } catch (error) {
    if (error.message === 'JOB_NOT_FOUND') {
      return res.status(404).json({ error: error.message, message: 'Vaga não encontrada.' })
    }
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao remover vaga.' })
  }
})

router.post('/jobs/:id/publish', requirePermission('recruitment:publish'), async (req, res) => {
  try {
    if (req.params.id === 'nova') {
      return res.status(400).json({
        error: 'VALIDATION',
        message: 'Salve a vaga antes de publicar.',
      })
    }
    const job = await publishJob(req.params.id, req.user.id, { ipAddress: getClientIp(req) })
    res.json({ job, message: 'Vaga publicada no portal.' })
  } catch (error) {
    if (error.message === 'JOB_NOT_FOUND') {
      return res.status(404).json({ error: error.message, message: 'Vaga não encontrada.' })
    }
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao publicar vaga.' })
  }
})

router.post('/jobs/:id/unpublish', requirePermission('recruitment:publish'), async (req, res) => {
  try {
    const job = await unpublishJob(req.params.id, req.user.id, { ipAddress: getClientIp(req) })
    res.json({ job, message: 'Vaga despublicada.' })
  } catch (error) {
    if (error.message === 'JOB_NOT_FOUND') {
      return res.status(404).json({ error: error.message, message: 'Vaga não encontrada.' })
    }
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao despublicar vaga.' })
  }
})

router.get('/catalogs/clients', requirePermission('recruitment:read'), async (_req, res) => {
  res.json({ items: await listClients() })
})

router.get('/catalogs/contracts', requirePermission('recruitment:read'), async (req, res) => {
  res.json({ items: await listContracts(req.query.clientId) })
})

router.get('/catalogs/departments', requirePermission('recruitment:read'), async (_req, res) => {
  res.json({ items: await listDepartments() })
})

router.get('/catalogs/states', requirePermission('recruitment:read'), async (_req, res) => {
  res.json({ items: await listStates() })
})

router.get('/catalogs/cities', requirePermission('recruitment:read'), async (req, res) => {
  res.json({ items: await listCities(req.query.stateId) })
})

router.get('/catalogs/units', requirePermission('recruitment:read'), async (_req, res) => {
  res.json({ items: await listOperationalUnits() })
})

export default router
