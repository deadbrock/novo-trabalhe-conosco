import { apiClient, apiRequest } from './api'

export const talentPoolService = {
  list(params = {}) {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')),
    ).toString()
    return apiRequest(`/admin/talent-pool${query ? `?${query}` : ''}`)
  },
  getStats() {
    return apiRequest('/admin/talent-pool/stats')
  },
  getAreas() {
    return apiRequest('/admin/talent-pool/areas')
  },
  get(id) {
    return apiRequest(`/admin/talent-pool/${id}`)
  },
  updateStatus(id, status) {
    return apiRequest(`/admin/talent-pool/${id}/status`, { method: 'PATCH', body: { status } })
  },
  async downloadResume(id, fileName = 'curriculo.pdf') {
    const response = await apiClient.get(`/admin/talent-pool/${id}/resume`, {
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
