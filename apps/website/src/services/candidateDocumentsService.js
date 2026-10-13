import { apiRequest } from './api'
import axios from 'axios'

export const RACE_OPTIONS = [
  { value: 'BRANCA', label: 'Branca' },
  { value: 'PRETA', label: 'Preta' },
  { value: 'PARDA', label: 'Parda' },
  { value: 'AMARELA', label: 'Amarela' },
  { value: 'INDIGENA', label: 'Indígena' },
]

export const candidateDocumentsService = {
  getEthnicDeclarationState(token) {
    return apiRequest('/candidate/documents/ethnic-declaration', { token })
  },

  signEthnicDeclaration(token, payload) {
    return apiRequest('/candidate/documents/ethnic-declaration/sign', {
      method: 'POST',
      token,
      body: payload,
    })
  },

  async getEthnicDeclarationPreviewUrl(token, { signed = false } = {}) {
    const headers = {}
    if (token) headers.Authorization = `Bearer ${token}`

    const path = signed
      ? '/api/candidate/documents/ethnic-declaration/file?inline=true'
      : '/api/candidate/documents/ethnic-declaration/preview?inline=true'

    const response = await axios.get(path, {
      headers,
      responseType: 'blob',
    })

    return URL.createObjectURL(response.data)
  },
}
