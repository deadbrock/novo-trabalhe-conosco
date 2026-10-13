export class DocuSignError extends Error {
  constructor(message, { code = 'DOCUSIGN_ERROR', status = 500, details = null } = {}) {
    super(message)
    this.name = 'DocuSignError'
    this.code = code
    this.status = status
    this.details = details
  }
}

export function wrapDocuSignError(error, action) {
  if (error instanceof DocuSignError) return error

  const body = error?.response?.body || error?.response?.data
  const message = body?.message || body?.error_description || error?.message || 'Erro DocuSign'
  const code = body?.errorCode || body?.error || 'DOCUSIGN_ERROR'

  return new DocuSignError(message, {
    code,
    status: error?.response?.status || 500,
    details: { action, body },
  })
}
