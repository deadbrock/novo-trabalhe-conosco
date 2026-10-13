import axios from 'axios'
import { ApiError } from './api'
import { getStoredToken } from '@/utils/authStorage'
import { formatApiErrorMessage, parseAxiosError } from '@/utils/parseApiError'

export async function apiUpload(path, { token, formData, method = 'POST' }) {
  const headers = { 'Content-Type': 'multipart/form-data' }
  const authToken = token || getStoredToken()
  if (authToken) headers.Authorization = `Bearer ${authToken}`

  try {
    const response = await axios.request({
      baseURL: '/api',
      url: path,
      method,
      data: formData,
      headers,
    })
    return response.data
  } catch (error) {
    const parsed = parseAxiosError(error, `upload ${path}`)
    throw new ApiError(
      formatApiErrorMessage(parsed),
      parsed.code,
      parsed.status,
      parsed.details,
    )
  }
}

export async function apiDownload(path, { token, filename }) {
  const headers = {}
  const authToken = token || getStoredToken()
  if (authToken) headers.Authorization = `Bearer ${authToken}`

  const response = await axios.get(`/api${path}`, { headers, responseType: 'blob' })

  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || 'curriculo'
  link.click()
  URL.revokeObjectURL(url)
}
