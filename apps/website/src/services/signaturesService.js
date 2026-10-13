import { apiRequest } from './api'

export const signaturesService = {
  getConfig() {
    return apiRequest('/candidate/signatures/config')
  },
  list(token) {
    return apiRequest('/candidate/signatures', { token })
  },
  get(token, id) {
    return apiRequest(`/candidate/signatures/${id}`, { token })
  },
  getSigningUrl(token, id, returnUrl) {
    return apiRequest(`/candidate/signatures/${id}/signing-url`, {
      method: 'POST',
      token,
      body: { returnUrl },
    })
  },
  refresh(token, id) {
    return apiRequest(`/candidate/signatures/${id}/refresh`, {
      method: 'POST',
      token,
    })
  },
}
