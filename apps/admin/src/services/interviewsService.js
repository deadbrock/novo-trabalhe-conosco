import { apiRequest } from './api'

export const interviewsService = {
  getStats() {
    return apiRequest('/admin/interviews/stats')
  },
  list(params = {}) {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')),
    ).toString()
    return apiRequest(`/admin/interviews${query ? `?${query}` : ''}`)
  },
  getApplications() {
    return apiRequest('/admin/interviews/candidates')
  },
  getCandidates() {
    return apiRequest('/admin/interviews/candidates')
  },
  get(id) {
    return apiRequest(`/admin/interviews/${id}`)
  },
  create(payload) {
    return apiRequest('/admin/interviews', { method: 'POST', body: payload })
  },
  update(id, payload) {
    return apiRequest(`/admin/interviews/${id}`, { method: 'PUT', body: payload })
  },
  remove(id) {
    return apiRequest(`/admin/interviews/${id}`, { method: 'DELETE' })
  },
  sendToDocumentation(id) {
    return apiRequest(`/admin/interviews/${id}/send-to-documentation`, { method: 'POST' })
  },
}
