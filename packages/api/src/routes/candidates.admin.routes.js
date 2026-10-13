import { Router } from 'express'
import { requireStaff, requirePermission } from '../middleware/auth.js'
import {
  getCandidateAdmin,
  getCandidateStats,
  getCandidateTimeline,
  listCandidateNotes,
  createCandidateNote,
  deleteCandidateNote,
  listCandidateStates,
  listCandidatesAdmin,
  reviewApplicationDocumentation,
  moveCandidateApplicationStage,
  streamCandidateResumeAdmin,
} from '../services/candidates.service.js'
import {
  reviewDocumentationItem,
  streamDocumentationItemDocument,
  uploadDocumentationItem,
} from '../services/applicationDocumentation.service.js'
import { resumeUpload } from '../middleware/upload.js'
import { getClientIp } from '../services/audit.service.js'
import { logRouteError, buildErrorBody } from '../utils/httpError.js'

const router = Router()

router.use(requireStaff)

router.get('/candidates/stats', requirePermission('candidates:read'), async (_req, res) => {
  try {
    const stats = await getCandidateStats()
    res.json({ stats })
  } catch (error) {
    logRouteError('candidates/stats', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao carregar estatísticas de candidatos.',
    })
    res.status(statusCode).json(body)
  }
})

router.get('/candidates/states', requirePermission('candidates:read'), async (_req, res) => {
  try {
    const states = await listCandidateStates()
    res.json({ states })
  } catch (error) {
    logRouteError('candidates/states', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao listar estados.',
    })
    res.status(statusCode).json(body)
  }
})

router.get('/candidates', requirePermission('candidates:read'), async (req, res) => {
  try {
    const candidates = await listCandidatesAdmin({
      search: req.query.search,
      status: req.query.status,
      state: req.query.state,
      emailVerified: req.query.emailVerified,
      hasApplications: req.query.hasApplications,
      rejectedOnly: req.query.rejectedOnly,
    })
    res.json({ candidates })
  } catch (error) {
    logRouteError('candidates/list', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao listar candidatos.',
    })
    res.status(statusCode).json(body)
  }
})

router.get('/candidates/:id', requirePermission('candidates:read'), async (req, res) => {
  const candidate = await getCandidateAdmin(req.params.id)
  if (!candidate) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Candidato não encontrado.' })
  }
  res.json({ candidate })
})

router.get('/candidates/:id/notes', requirePermission('candidates:read'), async (req, res) => {
  try {
    const notes = await listCandidateNotes(req.params.id)
    if (!notes) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Candidato não encontrado.' })
    }
    res.json({ notes })
  } catch (error) {
    logRouteError('candidates/notes/list', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao carregar notas.',
    })
    res.status(statusCode).json(body)
  }
})

router.post('/candidates/:id/notes', requirePermission('candidates:write'), async (req, res) => {
  try {
    const note = await createCandidateNote(
      req.params.id,
      req.user.id,
      req.body.content,
      { ipAddress: getClientIp(req) },
    )
    res.status(201).json({ note })
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Candidato não encontrado.' })
    }
    if (error.message === 'VALIDATION') {
      return res.status(400).json({ error: 'VALIDATION', message: 'Informe o conteúdo da nota.' })
    }
    logRouteError('candidates/notes/create', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao salvar nota.',
    })
    res.status(statusCode).json(body)
  }
})

router.delete('/candidates/:id/notes/:noteId', requirePermission('candidates:write'), async (req, res) => {
  try {
    await deleteCandidateNote(
      req.params.id,
      req.params.noteId,
      req.user.id,
      { ipAddress: getClientIp(req) },
    )
    res.json({ message: 'Nota removida.' })
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Nota não encontrada.' })
    }
    logRouteError('candidates/notes/delete', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao remover nota.',
    })
    res.status(statusCode).json(body)
  }
})

router.get('/candidates/:id/timeline', requirePermission('candidates:read'), async (req, res) => {
  try {
    const timeline = await getCandidateTimeline(req.params.id)
    if (!timeline) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Candidato não encontrado.' })
    }
    res.json({ timeline })
  } catch (error) {
    logRouteError('candidates/timeline', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao carregar histórico.',
    })
    res.status(statusCode).json(body)
  }
})

router.patch(
  '/candidates/:id/applications/:applicationId/stage',
  requirePermission('candidates:write'),
  async (req, res) => {
    try {
      const { stageSlug } = req.body
      if (!stageSlug?.trim()) {
        return res.status(400).json({ error: 'VALIDATION', message: 'Informe a etapa de destino.' })
      }

      const candidate = await moveCandidateApplicationStage(
        req.params.id,
        req.params.applicationId,
        stageSlug.trim(),
        req.user.id,
        { ipAddress: getClientIp(req) },
      )

      res.json({ candidate, message: 'Etapa atualizada com sucesso.' })
    } catch (error) {
      if (error.message === 'NOT_FOUND') {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Candidato não encontrado.' })
      }
      if (error.message === 'APPLICATION_NOT_FOUND') {
        return res.status(404).json({ error: error.message, message: 'Candidatura não encontrada.' })
      }
      if (error.message === 'INVALID_STAGE') {
        return res.status(400).json({ error: error.message, message: 'Etapa inválida.' })
      }
      logRouteError('candidates/application/stage', error)
      const { statusCode, body } = buildErrorBody(error, {
        errorCode: 'INTERNAL_ERROR',
        message: 'Erro ao atualizar etapa.',
      })
      res.status(statusCode).json(body)
    }
  },
)

router.post('/candidates/:id/applications/:applicationId/review', requirePermission('candidates:write'), async (req, res) => {
  try {
    const { decision, reason } = req.body
    const candidate = await reviewApplicationDocumentation(
      req.params.id,
      req.params.applicationId,
      decision,
      reason,
      req.user.id,
      { ipAddress: getClientIp(req) },
    )
    res.json({
      candidate,
      message: decision === 'approved'
        ? 'Documentação aprovada. Candidato encaminhado ao Departamento Pessoal.'
        : 'Documentação devolvida à origem com o motivo informado.',
    })
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Candidato não encontrado.' })
    }
    if (error.message === 'APPLICATION_NOT_FOUND') {
      return res.status(404).json({ error: error.message, message: 'Candidatura não encontrada.' })
    }
    if (error.message === 'INVALID_STAGE') {
      return res.status(400).json({
        error: error.message,
        message: 'Somente candidatos na etapa Documentação podem ser avaliados.',
      })
    }
    if (error.message === 'ALREADY_REJECTED') {
      return res.status(409).json({ error: error.message, message: 'Esta candidatura já foi reprovada.' })
    }
    if (error.message === 'DOCUMENTATION_NOT_FOUND') {
      return res.status(400).json({ error: error.message, message: 'Checklist de documentação não encontrado.' })
    }
    if (error.message === 'DOCUMENTS_INCOMPLETE') {
      return res.status(400).json({
        error: error.message,
        message: 'Aguardando envio de todos os documentos obrigatórios pelo candidato.',
      })
    }
    if (error.message === 'DOCUMENTS_NOT_APPROVED') {
      return res.status(400).json({
        error: error.message,
        message: 'Aprove todos os documentos do checklist antes de aprovar a candidatura.',
      })
    }
    if (error.message === 'VALIDATION') {
      return res.status(400).json({ error: 'VALIDATION', message: 'Informe o motivo da devolução.' })
    }
    logRouteError('candidates/application/review', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao avaliar documentação.',
    })
    res.status(statusCode).json(body)
  }
})

router.post(
  '/candidates/:id/applications/:applicationId/documentation/items/:itemId/review',
  requirePermission('candidates:write'),
  async (req, res) => {
    try {
      const candidate = await getCandidateAdmin(req.params.id)
      if (!candidate) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Candidato não encontrado.' })
      }

      const application = candidate.applications.find((app) => app.id === req.params.applicationId)
      if (!application?.documentation?.id) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Documentação não encontrada.' })
      }

      const documentation = await reviewDocumentationItem(
        application.documentation.id,
        req.params.itemId,
        req.body.decision,
        req.body.reason,
        req.user.id,
        { ipAddress: getClientIp(req) },
      )

      const refreshed = await getCandidateAdmin(req.params.id)
      res.json({ candidate: refreshed, documentation, message: 'Documento avaliado.' })
    } catch (error) {
      if (error.message === 'NOT_FOUND') {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Registro não encontrado.' })
      }
      if (error.message === 'ITEM_NOT_FOUND') {
        return res.status(404).json({ error: error.message, message: 'Item não encontrado.' })
      }
      if (error.message === 'ITEM_NOT_UPLOADED') {
        return res.status(400).json({ error: error.message, message: 'O candidato ainda não enviou este documento.' })
      }
      if (error.message === 'INVALID_STATUS') {
        return res.status(400).json({ error: error.message, message: 'Documentação não está em análise.' })
      }
      if (error.message === 'VALIDATION') {
        return res.status(400).json({ error: 'VALIDATION', message: 'Informe o motivo da reprovação.' })
      }
      logRouteError('candidates/documentation/review-item', error)
      const { statusCode, body } = buildErrorBody(error, {
        errorCode: 'INTERNAL_ERROR',
        message: 'Erro ao avaliar documento.',
      })
      res.status(statusCode).json(body)
    }
  },
)

router.get(
  '/candidates/:id/applications/:applicationId/documentation/items/:itemId/document',
  requirePermission('candidates:read'),
  async (req, res) => {
    try {
      const candidate = await getCandidateAdmin(req.params.id)
      if (!candidate) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Candidato não encontrado.' })
      }

      const application = candidate.applications.find((app) => app.id === req.params.applicationId)
      if (!application?.documentation?.id) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Documentação não encontrada.' })
      }

      const document = await streamDocumentationItemDocument(
        application.documentation.id,
        req.params.itemId,
      )
      const inline = req.query.inline === 'true'
      const disposition = inline ? 'inline' : 'attachment'

      res.setHeader('Content-Type', document.mimeType)
      res.setHeader(
        'Content-Disposition',
        `${disposition}; filename="${encodeURIComponent(document.originalName)}"`,
      )
      document.stream.pipe(res)
    } catch (error) {
      if (error.message === 'NOT_FOUND' || error.message === 'DOCUMENT_NOT_FOUND') {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Documento não encontrado.' })
      }
      logRouteError('candidates/documentation/document', error)
      const { statusCode, body } = buildErrorBody(error, {
        errorCode: 'INTERNAL_ERROR',
        message: 'Erro ao baixar documento.',
      })
      res.status(statusCode).json(body)
    }
  },
)

router.post(
  '/candidates/:id/applications/:applicationId/documentation/items/:itemId/upload',
  requirePermission('candidates:write'),
  (req, res) => {
    resumeUpload.single('document')(req, res, async (err) => {
      if (err) {
        if (err.message === 'INVALID_FILE_TYPE') {
          return res.status(400).json({ error: 'INVALID_FILE_TYPE', message: 'Formato inválido.' })
        }
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'FILE_TOO_LARGE', message: 'Arquivo muito grande.' })
        }
        return res.status(500).json({ error: 'UPLOAD_ERROR', message: 'Erro ao enviar documento.' })
      }

      if (!req.file) {
        return res.status(400).json({ error: 'NO_FILE', message: 'Selecione um arquivo.' })
      }

      try {
        const candidate = await getCandidateAdmin(req.params.id)
        if (!candidate) {
          return res.status(404).json({ error: 'NOT_FOUND', message: 'Candidato não encontrado.' })
        }

        const application = candidate.applications.find((app) => app.id === req.params.applicationId)
        if (!application?.documentation?.id) {
          return res.status(404).json({ error: 'NOT_FOUND', message: 'Documentação não encontrada.' })
        }

        await uploadDocumentationItem(
          application.documentation.id,
          req.params.itemId,
          req.file,
          req.user.id,
          { ipAddress: getClientIp(req) },
          { isCandidate: false },
        )

        const refreshed = await getCandidateAdmin(req.params.id)
        res.json({ candidate: refreshed, message: 'Documento enviado.' })
      } catch (error) {
        if (error.message === 'NOT_FOUND') {
          return res.status(404).json({ error: 'NOT_FOUND', message: 'Registro não encontrado.' })
        }
        if (error.message === 'INVALID_STATUS') {
          return res.status(400).json({ error: error.message, message: 'Documentação não aceita novos arquivos.' })
        }
        if (error.message === 'CANDIDATE_UPLOAD_ONLY') {
          return res.status(403).json({
            error: error.message,
            message: 'Na etapa de documentação, somente o candidato pode enviar arquivos pelo portal.',
          })
        }
        logRouteError('candidates/documentation/upload', error)
        const { statusCode, body } = buildErrorBody(error, {
          errorCode: 'INTERNAL_ERROR',
          message: 'Erro ao enviar documento.',
        })
        res.status(statusCode).json(body)
      }
    })
  },
)

router.get('/candidates/:id/resume', requirePermission('candidates:read'), async (req, res) => {
  try {
    const resume = await streamCandidateResumeAdmin(req.params.id)
    if (!resume) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Currículo não encontrado.' })
    }

    const inline = req.query.inline === 'true'
    const disposition = inline ? 'inline' : 'attachment'

    res.setHeader('Content-Type', resume.mimeType)
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${encodeURIComponent(resume.originalName)}"`,
    )
    resume.stream.pipe(res)
  } catch (error) {
    logRouteError('candidates/resume', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao baixar currículo.',
    })
    res.status(statusCode).json(body)
  }
})

export default router
