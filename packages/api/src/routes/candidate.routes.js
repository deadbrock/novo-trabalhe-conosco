import { Router } from 'express'
import fs from 'node:fs'
import { requireCandidate } from '../middleware/auth.js'
import { resumeUpload, documentationUpload } from '../middleware/upload.js'
import { updateCandidateProfile } from '../services/auth.service.js'
import {
  saveUserResume,
  removeUserResume,
  streamUserResume,
} from '../services/resume.service.js'
import { prisma, notDeleted } from '../lib/prisma.js'
import { getClientIp } from '../services/audit.service.js'
import { applyToJob } from '../services/jobs.service.js'
import { profileCompleteness } from '../utils/candidateProfile.js'
import {
  getCandidatePreAdmissionCase,
  listCandidatePreAdmissionCases,
  uploadChecklistItemDocument,
  streamChecklistItemDocument,
} from '../services/preAdmission.service.js'
import {
  getCandidateDocumentation,
  listCandidateDocumentations,
  uploadDocumentationItem,
  streamDocumentationItemDocument,
} from '../services/applicationDocumentation.service.js'
import {
  getCandidateSignatureRequest,
  getCandidateSigningUrl,
  listCandidateSignatureRequests,
  refreshSignatureRequestStatus,
  isDocuSignConfigured,
} from '../services/documentSignature.service.js'
import {
  getEthnicDeclarationState,
  signEthnicDeclaration,
  streamEthnicDeclarationPdf,
  streamDocumentTemplate,
} from '../services/candidateDocument.service.js'
import { env } from '../config/env.js'

const router = Router()

router.use(requireCandidate)

function profileCompleteScore(user) {
  return profileCompleteness(user, user.profile)
}

router.get('/me', (req, res) => {
  res.json({ user: req.user })
})

router.put('/profile', async (req, res) => {
  try {
    const user = await updateCandidateProfile(req.user.id, req.body, { ipAddress: getClientIp(req) })
    res.json({ user })
  } catch (error) {
    if (error.message === 'INVALID_CPF') {
      return res.status(400).json({ error: 'INVALID_CPF', message: 'CPF inválido.' })
    }
    if (error.message === 'INVALID_BIRTH_DATE') {
      return res.status(400).json({ error: 'INVALID_BIRTH_DATE', message: 'Data de nascimento inválida.' })
    }
    res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Usuário não encontrado.' })
  }
})

router.post('/resume', (req, res) => {
  resumeUpload.single('resume')(req, res, async (err) => {
    if (err) {
      if (err.message === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          error: 'INVALID_FILE_TYPE',
          message: 'Formato inválido. Envie PDF, DOC ou DOCX.',
        })
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'FILE_TOO_LARGE',
          message: 'Arquivo muito grande. Tamanho máximo: 5MB.',
        })
      }
      console.error(err)
      return res.status(500).json({ error: 'UPLOAD_ERROR', message: 'Erro ao enviar currículo.' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'NO_FILE', message: 'Selecione um arquivo para enviar.' })
    }

    try {
      const user = await saveUserResume(req.user.id, req.file, { ipAddress: getClientIp(req) })
      return res.json({ message: 'Currículo enviado com sucesso.', user })
    } catch (error) {
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path)
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Usuário não encontrado.' })
    }
  })
})

router.get('/resume', async (req, res) => {
  try {
    const resume = await streamUserResume(req.user.id)
    if (!resume) {
      return res.status(404).json({ error: 'NO_RESUME', message: 'Nenhum currículo encontrado.' })
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
    console.error(error)
    res.status(500).json({ error: 'DOWNLOAD_ERROR', message: 'Erro ao baixar currículo.' })
  }
})

router.delete('/resume', async (req, res) => {
  try {
    const user = await removeUserResume(req.user.id, { ipAddress: getClientIp(req) })
    res.json({ message: 'Currículo removido.', user })
  } catch (error) {
    res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Usuário não encontrado.' })
  }
})

router.post('/applications', async (req, res) => {
  try {
    const { jobId } = req.body
    if (!jobId) {
      return res.status(400).json({ error: 'VALIDATION', message: 'Informe a vaga.' })
    }
    const application = await applyToJob(
      { jobId, candidateUserId: req.user.id },
      { ipAddress: getClientIp(req) },
    )
    res.status(201).json({ message: 'Candidatura realizada com sucesso!', application })
  } catch (error) {
    if (error.message === 'JOB_NOT_FOUND') {
      return res.status(404).json({ error: error.message, message: 'Vaga não encontrada ou indisponível.' })
    }
    if (error.message === 'ALREADY_APPLIED') {
      return res.status(409).json({ error: error.message, message: 'Você já se candidatou a esta vaga.' })
    }
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao candidatar-se.' })
  }
})

router.get('/applications', async (req, res) => {
  const profile = await prisma.candidateProfile.findFirst({
    where: { userId: req.user.id, ...notDeleted() },
  })
  if (!profile) return res.json({ applications: [] })

  const applications = await prisma.application.findMany({
    where: { candidateId: profile.id, ...notDeleted() },
    include: { job: true },
    orderBy: { createdAt: 'desc' },
  })

  res.json({
    applications: applications.map((app) => ({
      id: app.id,
      jobId: app.jobId,
      jobTitle: app.job.title,
      status: app.status.toLowerCase(),
      currentStage: app.currentStage,
      createdAt: app.createdAt.toISOString(),
    })),
  })
})

router.get('/dashboard', async (req, res) => {
  const profile = await prisma.candidateProfile.findFirst({
    where: { userId: req.user.id, ...notDeleted() },
  })

  const applications = profile
    ? await prisma.application.findMany({
        where: { candidateId: profile.id, ...notDeleted() },
        include: {
          job: true,
          documentation: {
            where: notDeleted(),
            include: {
              items: { where: notDeleted() },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    : []

  const active = applications.filter((a) => !['REJECTED', 'WITHDRAWN'].includes(a.status))
  const interviews = applications.filter((a) => a.status === 'INTERVIEW')

  const documentationAlerts = applications
    .filter(
      (app) =>
        app.currentStage === 'documentation' &&
        app.documentation &&
        app.documentation.candidateNotifiedAt &&
        app.documentation.status === 'PENDING_UPLOAD',
    )
    .map((app) => {
      const doc = app.documentation
      const rejectedItems = doc.items.filter((item) => item.status === 'REJECTED').length
      const pendingItems = doc.items.filter((item) =>
        item.required && ['PENDING', 'REJECTED'].includes(item.status),
      ).length
      return {
        applicationId: app.id,
        documentationId: doc.id,
        jobTitle: app.job.title,
        status: doc.status,
        pendingItems,
        rejectedItems,
        requiresAction: pendingItems > 0,
      }
    })
    .filter((alert) => alert.requiresAction)

  res.json({
    stats: {
      activeApplications: active.length,
      interviews: interviews.length,
      profileComplete: profileCompleteScore(req.user),
      documentationPending: documentationAlerts.filter((alert) => alert.requiresAction).length,
    },
    documentationAlerts,
    applications: applications.slice(0, 5).map((app) => ({
      id: app.id,
      jobTitle: app.job.title,
      status: app.status.toLowerCase(),
      createdAt: app.createdAt.toISOString(),
    })),
  })
})

router.get('/documentation', async (req, res) => {
  try {
    const documentations = await listCandidateDocumentations(req.user.id)
    res.json({ documentations })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao carregar documentação.' })
  }
})

router.get('/documentation/:documentationId', async (req, res) => {
  try {
    const documentation = await getCandidateDocumentation(req.user.id, req.params.documentationId)
    res.json({ documentation })
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Documentação não encontrada.' })
    }
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao carregar documentação.' })
  }
})

router.post('/documentation/:documentationId/items/:itemId/upload', (req, res) => {
  documentationUpload.single('document')(req, res, async (err) => {
    if (err) {
      if (err.message === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          error: 'INVALID_FILE_TYPE',
          message: 'Formato inválido. Envie PDF, DOC, DOCX, JPG ou PNG.',
        })
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'FILE_TOO_LARGE', message: 'Arquivo muito grande. Máximo: 5MB.' })
      }
      return res.status(500).json({ error: 'UPLOAD_ERROR', message: 'Erro ao enviar documento.' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'NO_FILE', message: 'Selecione um arquivo.' })
    }

    try {
      await getCandidateDocumentation(req.user.id, req.params.documentationId)
      const documentation = await uploadDocumentationItem(
        req.params.documentationId,
        req.params.itemId,
        req.file,
        req.user.id,
        { ipAddress: getClientIp(req) },
        { isCandidate: true },
      )
      res.json({ documentation, message: 'Documento enviado com sucesso.' })
    } catch (error) {
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path)
      if (error.message === 'NOT_FOUND') {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Documentação não encontrada.' })
      }
      if (error.message === 'INVALID_STATUS') {
        return res.status(400).json({ error: error.message, message: 'Esta documentação não aceita novos arquivos.' })
      }
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao enviar documento.' })
    }
  })
})

router.get('/documentation/:documentationId/items/:itemId/document', async (req, res) => {
  try {
    await getCandidateDocumentation(req.user.id, req.params.documentationId)
    const document = await streamDocumentationItemDocument(
      req.params.documentationId,
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
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao baixar documento.' })
  }
})

router.get('/pre-admission', async (req, res) => {
  try {
    const cases = await listCandidatePreAdmissionCases(req.user.id)
    res.json({ cases })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao carregar pré-admissão.' })
  }
})

router.get('/pre-admission/:caseId', async (req, res) => {
  try {
    const preAdmissionCase = await getCandidatePreAdmissionCase(req.user.id, req.params.caseId)
    res.json({ case: preAdmissionCase })
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Caso não encontrado.' })
    }
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao carregar pré-admissão.' })
  }
})

router.post('/pre-admission/:caseId/items/:itemId/upload', (req, res) => {
  resumeUpload.single('document')(req, res, async (err) => {
    if (err) {
      if (err.message === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ error: 'INVALID_FILE_TYPE', message: 'Formato inválido. Envie PDF, DOC ou DOCX.' })
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'FILE_TOO_LARGE', message: 'Arquivo muito grande. Máximo: 5MB.' })
      }
      return res.status(500).json({ error: 'UPLOAD_ERROR', message: 'Erro ao enviar documento.' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'NO_FILE', message: 'Selecione um arquivo.' })
    }

    try {
      const preAdmissionCase = await uploadChecklistItemDocument(
        req.params.caseId,
        req.params.itemId,
        req.file,
        req.user.id,
        { ipAddress: getClientIp(req) },
        { isCandidate: true },
      )
      res.json({ case: preAdmissionCase, message: 'Documento enviado com sucesso.' })
    } catch (error) {
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path)
      if (error.message === 'NOT_FOUND') {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Caso não encontrado.' })
      }
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao enviar documento.' })
    }
  })
})

router.get('/pre-admission/:caseId/items/:itemId/document', async (req, res) => {
  try {
    await getCandidatePreAdmissionCase(req.user.id, req.params.caseId)
    const document = await streamChecklistItemDocument(req.params.caseId, req.params.itemId)
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
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao baixar documento.' })
  }
})

router.get('/documents/ethnic-declaration', async (req, res) => {
  try {
    const state = await getEthnicDeclarationState(req.user.id)
    res.json(state)
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Perfil não encontrado.' })
    }
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao carregar autodeclaração.' })
  }
})

router.get('/documents/ethnic-declaration/preview', async (_req, res) => {
  try {
    const file = await streamDocumentTemplate('ethnic-declaration')
    const inline = _req.query.inline === 'true'
    res.setHeader('Content-Type', file.mimeType)
    res.setHeader(
      'Content-Disposition',
      `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(file.fileName)}"`,
    )
    res.send(file.buffer)
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Modelo não encontrado.' })
    }
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao gerar visualização.' })
  }
})

router.get('/documents/ethnic-declaration/file', async (req, res) => {
  try {
    const document = await streamEthnicDeclarationPdf(req.user.id)
    const inline = req.query.inline === 'true'
    res.setHeader('Content-Type', document.mimeType)
    res.setHeader(
      'Content-Disposition',
      `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(document.fileName)}"`,
    )
    document.stream.pipe(res)
  } catch (error) {
    if (error.message === 'NOT_FOUND' || error.message === 'DOCUMENT_NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Documento não encontrado.' })
    }
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao baixar documento.' })
  }
})

router.post('/documents/ethnic-declaration/sign', async (req, res) => {
  try {
    const result = await signEthnicDeclaration(req.user.id, req.body, { ipAddress: getClientIp(req) })
    res.json({
      message: 'Assinatura iniciada. Conclua no modal DocuSign.',
      success: result.success,
      signingUrl: result.signingUrl,
      documentId: result.documentId,
      state: result.state,
    })
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Perfil não encontrado.' })
    }
    if (error.message === 'DECLARATION_REQUIRED') {
      return res.status(400).json({
        error: error.message,
        message: 'É necessário aceitar a declaração para continuar.',
      })
    }
    if (error.message === 'INVALID_RACE_CATEGORY') {
      return res.status(400).json({
        error: error.message,
        message: 'Selecione uma opção de autodeclaração.',
      })
    }
    if (error.message === 'DOCUSIGN_NOT_CONFIGURED') {
      return res.status(503).json({
        error: error.message,
        message: 'Assinatura eletrônica indisponível no momento.',
      })
    }
    if (error.message === 'TEMPLATE_NOT_CONFIGURED') {
      return res.status(400).json({
        error: error.message,
        message: 'Template DocuSign não configurado.',
      })
    }
    if (error.message === 'ALREADY_SIGNED') {
      return res.status(409).json({
        error: error.message,
        message: 'Este documento já foi assinado.',
      })
    }
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao assinar documento.' })
  }
})

router.get('/signatures/config', (_req, res) => {
  res.json({ configured: isDocuSignConfigured() })
})

router.get('/signatures', async (req, res) => {
  try {
    const signatures = await listCandidateSignatureRequests(req.user.id)
    res.json({ signatures })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao carregar assinaturas.' })
  }
})

router.get('/signatures/:id', async (req, res) => {
  try {
    const signature = await getCandidateSignatureRequest(req.user.id, req.params.id)
    res.json({ signature })
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Assinatura não encontrada.' })
    }
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao carregar assinatura.' })
  }
})

router.post('/signatures/:id/signing-url', async (req, res) => {
  try {
    const returnUrl =
      req.body.returnUrl ||
      `${env.appUrl}/portal-do-candidato/assinaturas?completed=${req.params.id}`
    const result = await getCandidateSigningUrl(req.user.id, req.params.id, returnUrl)
    res.json(result)
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Assinatura não encontrada.' })
    }
    if (error.message === 'ALREADY_SIGNED') {
      return res.status(409).json({ error: error.message, message: 'Documento já assinado.' })
    }
    if (error.message === 'DOCUSIGN_NOT_CONFIGURED') {
      return res.status(503).json({
        error: error.message,
        message: 'Assinatura eletrônica indisponível no momento.',
      })
    }
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao iniciar assinatura.' })
  }
})

router.post('/signatures/:id/refresh', async (req, res) => {
  try {
    const signature = await refreshSignatureRequestStatus(
      req.params.id,
      req.user.id,
      { ipAddress: getClientIp(req) },
    )
    res.json({ signature })
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Assinatura não encontrada.' })
    }
    console.error(error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao atualizar status.' })
  }
})

export default router
