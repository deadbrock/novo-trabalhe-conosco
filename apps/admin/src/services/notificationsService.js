import { apiRequest } from './api'

export const notificationsService = {
  list(params = {}) {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, value]) => value != null && value !== '')),
    ).toString()
    return apiRequest(`/admin/notifications${query ? `?${query}` : ''}`)
  },
}
