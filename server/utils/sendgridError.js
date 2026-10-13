export class EmailDeliveryError extends Error {
  constructor(message, details = null) {
    super(message)
    this.name = 'EMAIL_DELIVERY_FAILED'
    this.details = details
  }
}

export function parseSendGridError(error) {
  const errors = error?.response?.body?.errors
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0].message

    if (first.includes('Maximum credits exceeded')) {
      return 'Limite de envios do SendGrid atingido. Verifique seu plano ou aguarde a renovação.'
    }
    if (first.toLowerCase().includes('unauthorized') || error.code === 401) {
      return 'API Key do SendGrid inválida ou revogada. Gere uma nova chave no painel.'
    }
    if (first.includes('verified Sender Identity')) {
      return 'Remetente não verificado no SendGrid. Verifique ti.services@fgservices.com.br em Sender Authentication.'
    }

    return first
  }

  if (error.code === 401) {
    return 'API Key do SendGrid inválida ou revogada.'
  }

  return 'Não foi possível enviar o e-mail. Tente novamente em alguns minutos.'
}
