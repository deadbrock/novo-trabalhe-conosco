import { Router } from 'express'
import { requireStaff, requirePermission } from '../middleware/auth.js'
import { getClientIp } from '../services/audit.service.js'
import {
  createSignatureRequestForApplication,
  listAdminSignatureRequests,
  isDocuSignConfigured,
} from '../services/documentSignature.service.js'
import { listSignatureDocumentTypes } from '../constants/signatureDocuments.js'
import { logRouteError, buildErrorBody } from '../utils/httpError.js'

const router = Router()

router.use(requireStaff)

router.get('/signatures/config', requirePermission('candidates:read'), (_req, res) => {
  res.json({
    configured: isDocuSignConfigured(),
    documentTypes: listSignatureDocumentTypes().map((type) => ({
      slug: type.slug,
      label: type.label,
      description: type.description,
    })),
  })
})

router.get('/signatures', requirePermission('candidates:read'), async (req, res) => {
  try {
    const signatures = await listAdminSignatureRequests({
      applicationId: req.query.applicationId,
      status: req.query.status,
      limit: req.query.limit,
    })
    res.json({ signatures })
  } catch (error) {
    logRouteError('signatures/list', error)
    const { statusCode, body } = buildErrorBody(error, {
      errorCode: 'INTERNAL_ERROR',
      message: 'Erro ao listar assinaturas.',
    })
    res.status(statusCode).json(body)
  }
})

router.post(
  '/candidates/:candidateId/applications/:applicationId/signatures',
  requirePermission('candidates:write'),
  async (req, res) => {
    try {
      const documentType = req.body.documentType || 'autodeclaracao'
      const signature = await createSignatureRequestForApplication(
        req.params.applicationId,
        documentType,
        req.user.id,
        { ipAddress: getClientIp(req) },
      )
      res.status(201).json({ signature, message: 'Solicitação de assinatura enviada ao candidato.' })
    } catch (error) {
      if (error.message === 'DOCUSIGN_NOT_CONFIGURED') {
        return res.status(503).json({
          error: error.message,
          message: 'DocuSign não configurado. Verifique as variáveis DOCUSIGN_* no .env.',
        })
      }
      if (error.message === 'DOCUSIGN_DOCUMENT_MISSING') {
        return res.status(400).json({
          error: error.message,
          message: 'Configure DOCUSIGN_TEMPLATE_ID_AUTODECLARACAO ou adicione templates/signatures/autodeclaracao.pdf.',
        })
      }
      if (error.message === 'INVALID_STAGE') {
        return res.status(400).json({
          error: error.message,
          message: 'O candidato precisa estar na etapa Documentação.',
        })
      }
      if (error.message === 'ALREADY_SIGNED') {
        return res.status(409).json({
          error: error.message,
          message: 'Este documento já foi assinado.',
        })
      }
      if (error.message === 'DOCUMENTATION_NOT_FOUND') {
        return res.status(404).json({
          error: error.message,
          message: 'Checklist de documentação não encontrado.',
        })
      }
      logRouteError('signatures/create', error)
      const { statusCode, body } = buildErrorBody(error, {
        errorCode: 'INTERNAL_ERROR',
        message: 'Erro ao solicitar assinatura.',
      })
      res.status(statusCode).json(body)
    }
  },
)

export default router
