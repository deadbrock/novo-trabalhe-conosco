/** Intervalo mínimo entre sincronizações DocuSign por documento (evita estourar limite de polling). */
export const DOCUSIGN_SYNC_INTERVAL_MS = 30_000

/** Pausa global após erro 429 da DocuSign. */
export const DOCUSIGN_RATE_LIMIT_COOLDOWN_MS = 60 * 60 * 1000

const syncCache = new Map()
let rateLimitedUntil = 0

export function isDocuSignRateLimited() {
  return Date.now() < rateLimitedUntil
}

export function markDocuSignRateLimited() {
  rateLimitedUntil = Date.now() + DOCUSIGN_RATE_LIMIT_COOLDOWN_MS
}

export function isDocuSignPollingError(error) {
  return error?.code === 'HOURLY_ENVELOPE_POLLING_LIMIT_EXCEEDED'
}

export function getCachedEnvelopeSync(documentId) {
  const entry = syncCache.get(documentId)
  if (!entry) return null
  if (Date.now() - entry.at > DOCUSIGN_SYNC_INTERVAL_MS) return null
  return entry
}

export function setCachedEnvelopeSync(documentId, data) {
  syncCache.set(documentId, { at: Date.now(), ...data })
}

export function canSyncEnvelopeWithDocuSign(documentId) {
  if (isDocuSignRateLimited()) return false
  return !getCachedEnvelopeSync(documentId)
}
