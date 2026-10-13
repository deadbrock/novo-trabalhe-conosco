import axios from 'axios'
import { getStoredToken, clearStoredToken } from '@/utils/authStorage'
import { formatApiErrorMessage, parseAxiosError } from '@/utils/parseApiError'

export class ApiError extends Error {
  constructor(message, code, status, details = null) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

export const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const parsed = parseAxiosError(error)
    throw new ApiError(
      formatApiErrorMessage(parsed),
      parsed.code,
      parsed.status,
      parsed.details,
    )
  },
)

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, token, ...rest } = options

  const headers = { ...(rest.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await apiClient.request({
    url: path,
    method,
    data: body,
    headers,
    ...rest,
  })

  return response.data
}
