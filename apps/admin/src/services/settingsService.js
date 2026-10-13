import { apiClient, apiRequest } from './api'

export const profileService = {
  updateProfile(body) {
    return apiRequest('/admin/me/profile', { method: 'PUT', body })
  },

  changePassword(body) {
    return apiRequest('/admin/me/password', { method: 'PUT', body })
  },

  uploadAvatar(file) {
    const formData = new FormData()
    formData.append('avatar', file)
    return apiClient
      .post('/admin/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data)
  },

  removeAvatar() {
    return apiRequest('/admin/me/avatar', { method: 'DELETE' })
  },
}

export const settingsService = {
  listUsers() {
    return apiRequest('/admin/settings/users')
  },

  listRoles() {
    return apiRequest('/admin/settings/roles')
  },

  createUser(body) {
    return apiRequest('/admin/settings/users', { method: 'POST', body })
  },

  listAssignableRoles() {
    return apiRequest('/admin/settings/roles/assignable')
  },

  updateUser(id, body) {
    return apiRequest(`/admin/settings/users/${id}`, { method: 'PUT', body })
  },

  getIntegrations() {
    return apiRequest('/admin/settings/integrations')
  },

  getAuditLog(params = {}) {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')),
    ).toString()
    return apiRequest(`/admin/settings/audit-log${query ? `?${query}` : ''}`)
  },
}
