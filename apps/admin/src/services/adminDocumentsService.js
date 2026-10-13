import { apiClient, apiRequest } from './api'

export const adminDocumentsService = {
  list(candidateId) {
    return apiRequest(`/admin/candidates/${candidateId}/documents`)
  },

  getTimeline(documentId) {
    return apiRequest(`/admin/documents/${documentId}/timeline`)
  },

  async downloadPdf(documentId, fileName = 'documento.pdf') {
    const response = await apiClient.get(`/admin/documents/${documentId}/download`, {
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  async downloadCertificate(documentId, fileName = 'certificado.pdf') {
    const response = await apiClient.get(`/admin/documents/${documentId}/certificate`, {
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}
