import { documentService } from './DocumentService.js'
import { DocumentValidator } from './DocumentValidator.js'

function mapHttpError(error) {
  const map = {
    NOT_FOUND: { status: 404, message: 'Documento não encontrado.' },
    ALREADY_SIGNED: { status: 409, message: 'Documento já assinado.' },
    INVALID_STATUS: { status: 400, message: 'Documento não está disponível para assinatura.' },
    INVALID_ID: { status: 400, message: 'Identificador inválido.' },
    DOCUSIGN_NOT_CONFIGURED: { status: 503, message: 'Assinatura eletrônica indisponível.' },
    TEMPLATE_NOT_CONFIGURED: { status: 400, message: 'Template DocuSign não configurado para este documento.' },
    FILE_NOT_FOUND: { status: 404, message: 'PDF assinado não disponível.' },
    CERTIFICATE_NOT_FOUND: { status: 404, message: 'Certificado não disponível.' },
    ENVELOPE_NOT_FOUND: { status: 404, message: 'Envelope não encontrado.' },
  }

  const entry = map[error.message] || { status: 500, message: 'Erro interno.' }
  return { status: entry.status, body: { error: error.message, message: entry.message } }
}

export class DocumentController {
  constructor(service = documentService) {
    this.service = service
  }

  sign = async (req, res) => {
    try {
      DocumentValidator.assertUuid(req.params.id, 'documentId')
      const payload = DocumentValidator.validateSignPayload(req.body)

      const result = await this.service.initiateSign(req.params.id, req.user.id, {
        returnUrl: payload.returnUrl,
      })

      res.json(result)
    } catch (error) {
      const mapped = mapHttpError(error)
      res.status(mapped.status).json(mapped.body)
    }
  }

  status = async (req, res) => {
    try {
      DocumentValidator.assertUuid(req.params.id, 'documentId')
      const result = await this.service.getDocumentStatus(req.params.id, {
        userId: req.user.id,
      })
      res.json(result)
    } catch (error) {
      const mapped = mapHttpError(error)
      res.status(mapped.status).json(mapped.body)
    }
  }

  download = async (req, res) => {
    try {
      DocumentValidator.assertUuid(req.params.id, 'documentId')
      const file = await this.service.downloadSignedPdf(req.params.id, { userId: req.user.id })
      const inline = req.query.inline === 'true'
      res.setHeader('Content-Type', file.mimeType)
      res.setHeader(
        'Content-Disposition',
        `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(file.fileName)}"`,
      )
      file.stream.pipe(res)
    } catch (error) {
      const mapped = mapHttpError(error)
      res.status(mapped.status).json(mapped.body)
    }
  }

  certificate = async (req, res) => {
    try {
      DocumentValidator.assertUuid(req.params.id, 'documentId')
      const file = await this.service.downloadCertificate(req.params.id, { userId: req.user.id })
      const inline = req.query.inline === 'true'
      res.setHeader('Content-Type', file.mimeType)
      res.setHeader(
        'Content-Disposition',
        `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(file.fileName)}"`,
      )
      file.stream.pipe(res)
    } catch (error) {
      const mapped = mapHttpError(error)
      res.status(mapped.status).json(mapped.body)
    }
  }

  listMine = async (req, res) => {
    try {
      const documents = await this.service.listCandidateDocuments(req.user.id)
      res.json({ documents })
    } catch (error) {
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao listar documentos.' })
    }
  }

  adminList = async (req, res) => {
    try {
      DocumentValidator.assertUuid(req.params.candidateId, 'candidateId')
      const documents = await this.service.listAdminDocuments(req.params.candidateId)
      res.json({ documents })
    } catch (error) {
      const mapped = mapHttpError(error)
      res.status(mapped.status).json(mapped.body)
    }
  }

  adminTimeline = async (req, res) => {
    try {
      DocumentValidator.assertUuid(req.params.id, 'documentId')
      const timeline = await this.service.getDocumentTimeline(req.params.id)
      res.json(timeline)
    } catch (error) {
      const mapped = mapHttpError(error)
      res.status(mapped.status).json(mapped.body)
    }
  }

  adminDownload = async (req, res) => {
    try {
      DocumentValidator.assertUuid(req.params.id, 'documentId')
      const file = await this.service.downloadSignedPdf(req.params.id, { staff: true })
      res.setHeader('Content-Type', file.mimeType)
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(file.fileName)}"`,
      )
      file.stream.pipe(res)
    } catch (error) {
      const mapped = mapHttpError(error)
      res.status(mapped.status).json(mapped.body)
    }
  }

  adminCertificate = async (req, res) => {
    try {
      DocumentValidator.assertUuid(req.params.id, 'documentId')
      const file = await this.service.downloadCertificate(req.params.id, { staff: true })
      res.setHeader('Content-Type', file.mimeType)
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(file.fileName)}"`,
      )
      file.stream.pipe(res)
    } catch (error) {
      const mapped = mapHttpError(error)
      res.status(mapped.status).json(mapped.body)
    }
  }
}

export const documentController = new DocumentController()
