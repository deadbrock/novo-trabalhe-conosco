import { ROUTES } from '@/constants/routes'

export function buildSigningReturnUrl({ origin = window.location.origin } = {}) {
  return `${origin}${ROUTES.CANDIDATE_SIGNING_RETURN}`
}

export const DOCUSIGN_COMPLETE_EVENTS = new Set(['signing_complete', 'viewing_complete'])
export const DOCUSIGN_CANCEL_EVENTS = new Set(['cancel', 'decline', 'exception', 'session_timeout', 'ttl_expired'])
