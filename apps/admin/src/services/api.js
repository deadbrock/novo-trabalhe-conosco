import axios from 'axios'
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

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, ...rest } = options
  const response = await apiClient.request({
    url: path,
    method,
    data: body,
    ...rest,
  })
  return response.data
}
