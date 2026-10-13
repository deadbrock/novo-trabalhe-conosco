import { apiRequest } from './api'
import axios from 'axios'

export const documentsService = {
  list(token) {
    return apiRequest('/documents', { token })
  },

  sign(token, documentId, body = {}) {
    return apiRequest(`/documents/${documentId}/sign`, {
      method: 'POST',
      token,
      body,
    })
  },

  getStatus(token, documentId) {
    return apiRequest(`/documents/${documentId}/status`, { token })
  },

  async download(token, documentId, { inline = false } = {}) {
    const headers = { Authorization: `Bearer ${token}` }
    const response = await axios.get(
      `/api/documents/${documentId}/download${inline ? '?inline=true' : ''}`,
      { headers, responseType: 'blob' },
    )
    return response.data
  },

  async downloadCertificate(token, documentId) {
    const headers = { Authorization: `Bearer ${token}` }
    const response = await axios.get(`/api/documents/${documentId}/certificate`, {
      headers,
      responseType: 'blob',
    })
    return response.data
  },
}
