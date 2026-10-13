import { apiClient, apiRequest } from './api'

export const candidatesService = {
  list(params = {}) {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')),
    ).toString()
    return apiRequest(`/admin/candidates${query ? `?${query}` : ''}`)
  },
  getStats() {
    return apiRequest('/admin/candidates/stats')
  },
  getStates() {
    return apiRequest('/admin/candidates/states')
  },
  get(id) {
    return apiRequest(`/admin/candidates/${id}`)
  },
  getNotes(id) {
    return apiRequest(`/admin/candidates/${id}/notes`)
  },
  createNote(id, content) {
    return apiRequest(`/admin/candidates/${id}/notes`, { method: 'POST', body: { content } })
  },
  deleteNote(id, noteId) {
    return apiRequest(`/admin/candidates/${id}/notes/${noteId}`, { method: 'DELETE' })
  },
  getTimeline(id) {
    return apiRequest(`/admin/candidates/${id}/timeline`)
  },
  async downloadResume(id, fileName = 'curriculo.pdf') {
    const response = await apiClient.get(`/admin/candidates/${id}/resume`, {
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

  async getResumePreviewUrl(id) {
    const response = await apiClient.get(`/admin/candidates/${id}/resume`, {
      responseType: 'blob',
      params: { inline: true },
    })

    return URL.createObjectURL(response.data)
  },

  reviewApplication(candidateId, applicationId, decision, reason) {
    return apiRequest(`/admin/candidates/${candidateId}/applications/${applicationId}/review`, {
      method: 'POST',
      body: { decision, reason },
    })
  },

  moveApplicationStage(candidateId, applicationId, stageSlug) {
    return apiRequest(`/admin/candidates/${candidateId}/applications/${applicationId}/stage`, {
      method: 'PATCH',
      body: { stageSlug },
    })
  },

  reviewDocumentationItem(candidateId, applicationId, itemId, decision, reason) {
    return apiRequest(
      `/admin/candidates/${candidateId}/applications/${applicationId}/documentation/items/${itemId}/review`,
      { method: 'POST', body: { decision, reason } },
    )
  },

  uploadDocumentationItem(candidateId, applicationId, itemId, file) {
    const formData = new FormData()
    formData.append('document', file)
    return apiClient.post(
      `/admin/candidates/${candidateId}/applications/${applicationId}/documentation/items/${itemId}/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ).then((res) => res.data)
  },

  async downloadDocumentationItem(candidateId, applicationId, itemId, fileName = 'documento.pdf') {
    const response = await apiClient.get(
      `/admin/candidates/${candidateId}/applications/${applicationId}/documentation/items/${itemId}/document`,
      { responseType: 'blob' },
    )

    const url = window.URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  async getDocumentationItemPreviewUrl(candidateId, applicationId, itemId) {
    const response = await apiClient.get(
      `/admin/candidates/${candidateId}/applications/${applicationId}/documentation/items/${itemId}/document`,
      { responseType: 'blob', params: { inline: true } },
    )

    return URL.createObjectURL(response.data)
  },
}
