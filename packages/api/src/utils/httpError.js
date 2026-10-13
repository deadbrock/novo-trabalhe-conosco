import { env } from '../config/env.js'

export function logRouteError(scope, error, extra = {}) {
  console.error(`[${scope}]`, {
    name: error?.name,
    message: error?.message,
    code: error?.code,
    ...extra,
  })
}

export function buildErrorBody(error, { errorCode, message, statusCode = 500 }) {
  const body = {
    error: errorCode,
    message,
  }

  if (env.nodeEnv !== 'production' && error?.message) {
    body.details = error.message
  }

  return { statusCode, body }
}
