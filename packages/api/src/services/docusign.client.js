export {
  DocuSignProvider,
  isDocuSignConfigured,
} from '../modules/signatures/providers/docusign/DocuSignProvider.js'

export { getSignatureProvider } from '../modules/signatures/providers/index.js'

/** @deprecated Use getSignatureProvider('docusign') instead */
export async function createEmbeddedSigningEnvelope(params) {
  const { getSignatureProvider } = await import('../modules/signatures/providers/index.js')
  const provider = getSignatureProvider('docusign')
  const result = await provider.createEnvelope(params)
  return result.envelopeId
}

/** @deprecated */
export async function createRecipientSigningUrl(params) {
  const { getSignatureProvider } = await import('../modules/signatures/providers/index.js')
  const provider = getSignatureProvider('docusign')
  return provider.getEmbeddedSigningUrl(params)
}

/** @deprecated */
export async function getEnvelopeStatus(envelopeId) {
  const { getSignatureProvider } = await import('../modules/signatures/providers/index.js')
  const provider = getSignatureProvider('docusign')
  return provider.getEnvelopeStatus(envelopeId)
}

/** @deprecated */
export async function downloadCompletedDocument(envelopeId, documentId = 'combined') {
  const { getSignatureProvider } = await import('../modules/signatures/providers/index.js')
  const provider = getSignatureProvider('docusign')
  if (documentId === 'certificate') return provider.downloadCertificate(envelopeId)
  return provider.downloadSignedPdf(envelopeId)
}

/** @deprecated */
export function mapDocuSignStatusToInternal(status) {
  const map = {
    created: 'CREATED',
    sent: 'SENT',
    delivered: 'DELIVERED',
    signed: 'SIGNED',
    completed: 'COMPLETED',
    declined: 'DECLINED',
    voided: 'VOIDED',
  }
  return map[String(status || '').toLowerCase()] || 'SENT'
}

export function assertDocuSignConfigured() {
  if (!isDocuSignConfigured()) throw new Error('DOCUSIGN_NOT_CONFIGURED')
}
