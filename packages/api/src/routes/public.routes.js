import { Router } from 'express'
import { getAllPublishedCmsContent, getPublishedCmsContent } from '../services/cms.service.js'
import { listPublicJobs, getPublicJobBySlug } from '../services/jobs.service.js'

const router = Router()

router.get('/cms', async (_req, res) => {
  try {
    const cms = await getAllPublishedCmsContent()
    res.json(cms)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao carregar conteúdo.' })
  }
})

router.get('/cms/:slug', async (req, res) => {
  try {
    const content = await getPublishedCmsContent(req.params.slug)
    if (!content) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Conteúdo não encontrado.' })
    }
    res.json({ content })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao carregar conteúdo.' })
  }
})

router.get('/jobs', async (_req, res) => {
  try {
    const jobs = await listPublicJobs()
    res.json({ jobs })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao listar vagas.' })
  }
})

router.get('/jobs/:slug', async (req, res) => {
  try {
    const job = await getPublicJobBySlug(req.params.slug)
    if (!job) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Vaga não encontrada.' })
    }
    res.json({ job })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao buscar vaga.' })
  }
})

export default router
