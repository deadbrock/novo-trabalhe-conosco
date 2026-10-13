import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from '../../config/env.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Registro extensível de tipos de documento corporativos */
export const DOCUMENT_TYPE_REGISTRY = {
  ETHNIC_DECLARATION: {
    type: 'ETHNIC_DECLARATION',
    slug: 'autodeclaracao',
    label: 'Autodeclaração Étnico-Racial',
    fileBaseName: 'autodeclaracao',
    documentationItemSlug: 'autodeclaracao',
    portalRoute: '/portal-do-candidato/autodeclaracao-etnica',
    templateId: env.docusignTemplateAutodeclaracao,
    templateRole: env.docusignTemplateRole || 'Candidato',
    emailSubject: 'Assinatura — Autodeclaração Étnico-Racial FG Services',
  },
  LGPD: {
    type: 'LGPD',
    slug: 'lgpd',
    label: 'Termo LGPD',
    fileBaseName: 'lgpd',
    documentationItemSlug: null,
    portalRoute: null,
    templateId: '',
    templateRole: 'Candidato',
    emailSubject: 'Assinatura — Termo LGPD FG Services',
  },
  WORK_CONTRACT: {
    type: 'WORK_CONTRACT',
    slug: 'contrato-trabalho',
    label: 'Contrato de Trabalho',
    fileBaseName: 'contrato_trabalho',
    documentationItemSlug: null,
    portalRoute: null,
    templateId: '',
    templateRole: 'Candidato',
    emailSubject: 'Assinatura — Contrato de Trabalho FG Services',
  },
  TRANSPORT_VOUCHER: {
    type: 'TRANSPORT_VOUCHER',
    slug: 'vale-transporte',
    label: 'Vale Transporte',
    fileBaseName: 'vale_transporte',
    documentationItemSlug: null,
    portalRoute: null,
    templateId: '',
    templateRole: 'Candidato',
    emailSubject: 'Assinatura — Vale Transporte FG Services',
  },
  CODE_OF_CONDUCT: {
    type: 'CODE_OF_CONDUCT',
    slug: 'codigo-conduta',
    label: 'Código de Conduta',
    fileBaseName: 'codigo_conduta',
    documentationItemSlug: null,
    portalRoute: null,
    templateId: '',
    templateRole: 'Candidato',
    emailSubject: 'Assinatura — Código de Conduta FG Services',
  },
  CONFIDENTIALITY: {
    type: 'CONFIDENTIALITY',
    slug: 'confidencialidade',
    label: 'Termo de Confidencialidade',
    fileBaseName: 'confidencialidade',
    documentationItemSlug: null,
    portalRoute: null,
    templateId: '',
    templateRole: 'Candidato',
    emailSubject: 'Assinatura — Confidencialidade FG Services',
  },
  REGISTRATION_FORM: {
    type: 'REGISTRATION_FORM',
    slug: 'ficha-registro',
    label: 'Ficha de Registro',
    fileBaseName: 'ficha_registro',
    documentationItemSlug: null,
    portalRoute: null,
    templateId: '',
    templateRole: 'Candidato',
    emailSubject: 'Assinatura — Ficha de Registro FG Services',
  },
  TERMS_OF_USE: {
    type: 'TERMS_OF_USE',
    slug: 'termo-uso',
    label: 'Termo de Uso',
    fileBaseName: 'termo_uso',
    documentationItemSlug: null,
    portalRoute: null,
    templateId: '',
    templateRole: 'Candidato',
    emailSubject: 'Assinatura — Termo de Uso FG Services',
  },
}

export const DOCUMENT_STATUS_LABELS = {
  PENDING: 'Pendente',
  SENT: 'Enviado',
  DELIVERED: 'Entregue',
  VIEWED: 'Visualizado',
  SIGNED: 'Assinado',
  DECLINED: 'Recusado',
  VOIDED: 'Cancelado',
  ERROR: 'Erro',
}

export const SIGNABLE_STATUSES = ['PENDING', 'SENT', 'DELIVERED', 'VIEWED']
export const TERMINAL_STATUSES = ['SIGNED', 'DECLINED', 'VOIDED', 'ERROR']

export const EVENT_LABELS = {
  DOCUMENT_CREATED: 'Documento criado',
  ENVELOPE_CREATED: 'Envelope criado',
  ENVELOPE_SENT: 'Documento enviado',
  ENVELOPE_DELIVERED: 'Documento entregue',
  ENVELOPE_VIEWED: 'Documento visualizado',
  ENVELOPE_SIGNED: 'Documento assinado',
  ENVELOPE_DECLINED: 'Assinatura recusada',
  ENVELOPE_VOIDED: 'Envelope cancelado',
  ENVELOPE_ERROR: 'Erro no processo',
  PDF_STORED: 'PDF assinado armazenado',
  CERTIFICATE_STORED: 'Certificado armazenado',
  WEBHOOK_RECEIVED: 'Webhook recebido',
}

export function getDocumentTypeConfig(type) {
  return DOCUMENT_TYPE_REGISTRY[type] || null
}

export function listDocumentTypes() {
  return Object.values(DOCUMENT_TYPE_REGISTRY)
}

export function candidateStorageDir(candidateId) {
  return `documents/candidate-${candidateId}`
}

export function signedPdfFileName(fileBaseName) {
  return `${fileBaseName}.pdf`
}

export function certificateFileName(fileBaseName) {
  return `${fileBaseName}_certificate.pdf`
}

export function mapProviderStatusToDocumentStatus(providerStatus) {
  const map = {
    created: 'PENDING',
    sent: 'SENT',
    delivered: 'DELIVERED',
    viewed: 'VIEWED',
    signed: 'SIGNED',
    completed: 'SIGNED',
    declined: 'DECLINED',
    voided: 'VOIDED',
    error: 'ERROR',
  }
  return map[String(providerStatus || '').toLowerCase()] || 'SENT'
}

export function isProviderSignedStatus(providerStatus) {
  const normalized = String(providerStatus || '').toLowerCase()
  return normalized === 'signed' || normalized === 'completed'
}
