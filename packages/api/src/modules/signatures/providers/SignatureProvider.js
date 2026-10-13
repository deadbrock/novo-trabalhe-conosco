export class SignatureProvider {
  static providerName = 'base'

  isConfigured() {
    throw new Error('NOT_IMPLEMENTED')
  }

  createEnvelope() {
    throw new Error('NOT_IMPLEMENTED')
  }

  getEmbeddedSigningUrl() {
    throw new Error('NOT_IMPLEMENTED')
  }

  getEnvelopeStatus() {
    throw new Error('NOT_IMPLEMENTED')
  }

  downloadSignedPdf() {
    throw new Error('NOT_IMPLEMENTED')
  }

  downloadCertificate() {
    throw new Error('NOT_IMPLEMENTED')
  }
}
