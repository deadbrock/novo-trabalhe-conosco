import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from '../config/env.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const templatesDir = path.resolve(__dirname, '../../templates/signatures')

/** Tipos de documento disponíveis para assinatura eletrônica no portal */
export const SIGNATURE_DOCUMENT_TYPES = {
  autodeclaracao: {
    slug: 'autodeclaracao',
    label: 'Autodeclaração',
    description: 'Formulário de autodeclaração para admissão — assine eletronicamente pelo portal.',
    documentationItemSlug: 'autodeclaracao',
    templateId: env.docusignTemplateAutodeclaracao,
    templateRole: env.docusignTemplateRole || 'signer',
    localPdfPath: path.join(templatesDir, 'autodeclaracao.pdf'),
    emailSubject: 'Assinatura — Autodeclaração FG Services',
  },
}

export function getSignatureDocumentType(slug) {
  return SIGNATURE_DOCUMENT_TYPES[slug] || null
}

export function listSignatureDocumentTypes() {
  return Object.values(SIGNATURE_DOCUMENT_TYPES)
}

export const SIGNATURE_STATUS_LABELS = {
  CREATED: 'Preparando',
  SENT: 'Aguardando assinatura',
  DELIVERED: 'Aguardando assinatura',
  SIGNED: 'Assinado',
  COMPLETED: 'Concluído',
  DECLINED: 'Recusado',
  VOIDED: 'Cancelado',
  ERROR: 'Erro',
}

export const PENDING_SIGNATURE_STATUSES = ['CREATED', 'SENT', 'DELIVERED']
