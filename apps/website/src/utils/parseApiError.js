const STATUS_MESSAGES = {
  400: 'Requisição inválida.',
  401: 'Sessão expirada ou não autenticado.',
  403: 'Acesso negado.',
  404: 'Recurso não encontrado.',
  409: 'Conflito com dados existentes.',
  422: 'Dados inválidos.',
  429: 'Muitas tentativas. Aguarde e tente novamente.',
  500: 'Erro interno no servidor.',
  502: 'API indisponível. Inicie com: pnpm dev:api (ou pnpm dev).',
  503: 'Serviço temporariamente indisponível.',
  504: 'Tempo esgotado aguardando resposta da API.',
}

function readResponseMessage(data) {
  if (!data) return null
  if (typeof data === 'string') return data
  return data.message || data.error || null
}

/**
 * Converte erros Axios/fetch em mensagem legível + metadados para logs.
 */
export function parseAxiosError(error, context = '') {
  const status = error.response?.status ?? 0
  const data = error.response?.data
  const apiCode = typeof data === 'object' && data?.error ? data.error : null
  const apiMessage = readResponseMessage(data)
  const url = error.config?.url || error.config?.baseURL || ''
  const method = (error.config?.method || 'GET').toUpperCase()

  let message = apiMessage
  let code = apiCode || error.code || 'UNKNOWN'
  let details = typeof data === 'object' ? data.details || data.cause || null : null

  if (!error.response) {
    const networkMsg = error.message || ''
    if (error.code === 'ERR_NETWORK' || networkMsg.includes('Network Error')) {
      message = 'Sem conexão com a API. Verifique se pnpm dev está rodando (porta 3001).'
      code = 'NETWORK_ERROR'
      details = networkMsg || 'ERR_NETWORK'
    } else if (error.code === 'ECONNABORTED') {
      message = 'A requisição expirou antes de receber resposta.'
      code = 'TIMEOUT'
      details = networkMsg
    } else {
      message = `Falha de conexão com a API (${networkMsg || 'connection reset'}).`
      code = 'CONNECTION_ERROR'
      details = networkMsg
    }
  } else if (!message) {
    message = STATUS_MESSAGES[status] || `Erro HTTP ${status}.`
    code = apiCode || `HTTP_${status}`
  }

  if (status === 502 && !apiMessage) {
    message = STATUS_MESSAGES[502]
    code = 'BAD_GATEWAY'
    details = 'O proxy Vite não alcançou http://localhost:3001'
  }

  const logPayload = {
    context: context || undefined,
    method,
    url,
    status: status || undefined,
    code,
    message,
    details,
    response: import.meta.env.DEV ? data : undefined,
  }

  if (import.meta.env.DEV) {
    console.error('[FG Careers API]', logPayload)
  }

  return {
    message,
    code,
    status,
    details,
    logPayload,
  }
}

export function formatApiErrorMessage(parsed) {
  if (import.meta.env.DEV && parsed.details) {
    return `${parsed.message} [${parsed.code}: ${parsed.details}]`
  }
  return parsed.message
}
