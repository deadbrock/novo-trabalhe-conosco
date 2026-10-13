import axios from 'axios'
import { ApiError } from './api'
import { formatApiErrorMessage, parseAxiosError } from '@/utils/parseApiError'
import {
  getStoredToken,
  getStoredRefreshToken,
  setStoredTokens,
  clearStoredTokens,
} from '@/utils/authStorage'

let refreshPromise = null
let interceptorsInstalled = false

async function refreshAccessToken() {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) throw new ApiError('Sessão expirada.', 'SESSION_EXPIRED', 401)

  const response = await axios.post('/api/admin/auth/refresh', { refreshToken })
  const { token, refreshToken: newRefresh, user } = response.data
  setStoredTokens({ token, refreshToken: newRefresh })
  return { token, user }
}

export function getRefreshHandler() {
  return refreshAccessToken
}

export async function tryRefreshToken() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

export function setupAuthInterceptors(apiClient, onSessionExpired) {
  if (interceptorsInstalled) return
  interceptorsInstalled = true

  apiClient.interceptors.request.use((config) => {
    const token = getStoredToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error instanceof ApiError) {
        throw error
      }

      const original = error.config
      const status = error.response?.status

      if (status === 401 && !original._retry && getStoredRefreshToken()) {
        original._retry = true
        try {
          const { token } = await tryRefreshToken()
          original.headers.Authorization = `Bearer ${token}`
          return apiClient.request(original)
        } catch {
          clearStoredTokens()
          onSessionExpired?.()
        }
      }

      if (status === 401) {
        clearStoredTokens()
        onSessionExpired?.()
      }

      const parsed = parseAxiosError(error, original?.url)
      throw new ApiError(
        formatApiErrorMessage(parsed),
        parsed.code,
        parsed.status,
        parsed.details,
      )
    },
  )
}
