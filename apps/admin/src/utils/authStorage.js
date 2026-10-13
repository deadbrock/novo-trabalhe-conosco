const TOKEN_KEY = 'fg_recruit_token'
const REFRESH_KEY = 'fg_recruit_refresh'

export function getStoredToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function getStoredRefreshToken() {
  return sessionStorage.getItem(REFRESH_KEY)
}

export function setStoredTokens({ token, refreshToken }) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token)
  if (refreshToken) sessionStorage.setItem(REFRESH_KEY, refreshToken)
}

export function setStoredToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredTokens() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_KEY)
}

/** @deprecated use clearStoredTokens */
export function clearStoredToken() {
  clearStoredTokens()
}
