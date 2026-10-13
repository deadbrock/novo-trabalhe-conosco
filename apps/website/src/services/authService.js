import { apiRequest } from './api'

export const authService = {
  register(payload) {
    return apiRequest('/auth/register', { method: 'POST', body: payload })
  },

  login(payload) {
    return apiRequest('/auth/login', { method: 'POST', body: payload })
  },

  verifyEmail(token) {
    return apiRequest(`/auth/verify-email/${token}`)
  },

  resendVerification(email) {
    return apiRequest('/auth/resend-verification', { method: 'POST', body: { email } })
  },

  getMe(token) {
    return apiRequest('/candidate/me', { token })
  },
}
