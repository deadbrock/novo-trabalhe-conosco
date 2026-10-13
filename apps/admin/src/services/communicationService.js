import { apiRequest } from './api'

export const communicationService = {
  getStats() {
    return apiRequest('/admin/communication/stats')
  },
  listTemplates() {
    return apiRequest('/admin/communication/templates')
  },
  createTemplate(payload) {
    return apiRequest('/admin/communication/templates', { method: 'POST', body: payload })
  },
  updateTemplate(id, payload) {
    return apiRequest(`/admin/communication/templates/${id}`, { method: 'PUT', body: payload })
  },
  removeTemplate(id) {
    return apiRequest(`/admin/communication/templates/${id}`, { method: 'DELETE' })
  },
  listLogs(params = {}) {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')),
    ).toString()
    return apiRequest(`/admin/communication/logs${query ? `?${query}` : ''}`)
  },
  preview(payload) {
    return apiRequest('/admin/communication/preview', { method: 'POST', body: payload })
  },
  send(payload) {
    return apiRequest('/admin/communication/send', { method: 'POST', body: payload })
  },
}
