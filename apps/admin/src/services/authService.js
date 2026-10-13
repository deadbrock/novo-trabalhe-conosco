import { apiRequest } from './api'

export const authService = {
  login(credentials) {
    return apiRequest('/admin/auth/login', { method: 'POST', body: credentials })
  },
  refresh(refreshToken) {
    return apiRequest('/admin/auth/refresh', { method: 'POST', body: { refreshToken } })
  },
  logout(refreshToken) {
    return apiRequest('/admin/auth/logout', { method: 'POST', body: { refreshToken } })
  },
  getMe() {
    return apiRequest('/admin/me')
  },
}

export const dashboardService = {
  getOverview() {
    return apiRequest('/admin/dashboard')
  },
  getActivities(params = {}) {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')),
    ).toString()
    return apiRequest(`/admin/dashboard/activities${query ? `?${query}` : ''}`)
  },
  getFunnel() {
    return apiRequest('/admin/dashboard/funnel')
  },
  getByState() {
    return apiRequest('/admin/dashboard/by-state')
  },
}
