const STATUS_MESSAGES = {
  400: 'Requisição inválida.',
  401: 'Sessão expirada. Faça login novamente.',
  403: 'Permissão insuficiente.',
  404: 'Recurso não encontrado.',
  409: 'Conflito com dados existentes.',
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

export function parseAxiosError(error, context = '') {
  if (error instanceof Error && error.name === 'ApiError') {
    return {
      message: error.message,
      code: error.code || 'API_ERROR',
      status: error.status || 0,
      details: error.details || null,
    }
  }

  const status = error.response?.status ?? 0
  const data = error.response?.data
  const apiCode = typeof data === 'object' && data?.error ? data.error : null
  const apiMessage = readResponseMessage(data)
  const url = error.config?.url || ''
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
    details = 'Proxy Vite → http://localhost:3001 falhou'
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
    console.error('[FG Recruit API]', logPayload)
  }

  return { message, code, status, details, logPayload }
}

export function formatApiErrorMessage(parsed) {
  if (!import.meta.env.DEV || !parsed.details) {
    return parsed.message
  }

  if (parsed.details === parsed.message) {
    return parsed.message
  }

  if (typeof parsed.details === 'string' && parsed.details.includes('Falha de conexão com a API')) {
    return parsed.message
  }

  return `${parsed.message} (${parsed.code})`
}
