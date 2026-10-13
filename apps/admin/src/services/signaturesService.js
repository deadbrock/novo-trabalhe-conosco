import { apiRequest } from './api'

export const signaturesService = {
  getConfig() {
    return apiRequest('/admin/signatures/config')
  },
  list(params = {}) {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, value]) => value != null && value !== '')),
    ).toString()
    return apiRequest(`/admin/signatures${query ? `?${query}` : ''}`)
  },
  request(candidateId, applicationId, documentType = 'autodeclaracao') {
    return apiRequest(
      `/admin/candidates/${candidateId}/applications/${applicationId}/signatures`,
      { method: 'POST', body: { documentType } },
    )
  },
}
