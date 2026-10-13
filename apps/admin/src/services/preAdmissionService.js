import { apiClient, apiRequest } from './api'

export const preAdmissionService = {
  getStats() {
    return apiRequest('/admin/pre-admission/stats')
  },
  list(params = {}) {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')),
    ).toString()
    return apiRequest(`/admin/pre-admission${query ? `?${query}` : ''}`)
  },
  get(id) {
    return apiRequest(`/admin/pre-admission/${id}`)
  },
  forwardToDp(id) {
    return apiRequest(`/admin/pre-admission/${id}/forward-to-dp`, { method: 'POST' })
  },
  reviewItem(caseId, itemId, decision, reason) {
    return apiRequest(`/admin/pre-admission/${caseId}/items/${itemId}/review`, {
      method: 'PATCH',
      body: { decision, reason },
    })
  },
  async uploadDocument(caseId, itemId, file) {
    const formData = new FormData()
    formData.append('document', file)
    const response = await apiClient.post(
      `/admin/pre-admission/${caseId}/items/${itemId}/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return response.data
  },
  async downloadDocument(caseId, itemId, fileName = 'documento.pdf') {
    const response = await apiClient.get(
      `/admin/pre-admission/${caseId}/items/${itemId}/document`,
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
}

export const hrDepartmentService = {
  getStats() {
    return apiRequest('/admin/hr-department/stats')
  },
  list(params = {}) {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')),
    ).toString()
    return apiRequest(`/admin/hr-department${query ? `?${query}` : ''}`)
  },
  get(id) {
    return apiRequest(`/admin/hr-department/${id}`)
  },
  review(id, decision, notes, reason) {
    return apiRequest(`/admin/hr-department/${id}/review`, {
      method: 'PATCH',
      body: { decision, notes, reason },
    })
  },
  hire(id) {
    return apiRequest(`/admin/hr-department/${id}/hire`, { method: 'POST' })
  },
  async downloadDocument(caseId, itemId, fileName = 'documento.pdf') {
    const response = await apiClient.get(
      `/admin/hr-department/${caseId}/items/${itemId}/document`,
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

  async getDocumentPreviewUrl(caseId, itemId) {
    const response = await apiClient.get(
      `/admin/hr-department/${caseId}/items/${itemId}/document`,
      { responseType: 'blob', params: { inline: true } },
    )

    return URL.createObjectURL(response.data)
  },
}
