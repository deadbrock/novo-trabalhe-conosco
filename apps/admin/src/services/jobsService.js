import { apiRequest } from './api'

export const jobsService = {
  list(params = {}) {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')),
    ).toString()
    return apiRequest(`/admin/jobs${query ? `?${query}` : ''}`)
  },
  get(id) {
    return apiRequest(`/admin/jobs/${id}`)
  },
  create(data) {
    return apiRequest('/admin/jobs', { method: 'POST', body: data })
  },
  update(id, data) {
    return apiRequest(`/admin/jobs/${id}`, { method: 'PUT', body: data })
  },
  remove(id) {
    return apiRequest(`/admin/jobs/${id}`, { method: 'DELETE' })
  },
  publish(id) {
    return apiRequest(`/admin/jobs/${id}/publish`, { method: 'POST' })
  },
  unpublish(id) {
    return apiRequest(`/admin/jobs/${id}/unpublish`, { method: 'POST' })
  },
}

export const catalogsService = {
  clients: () => apiRequest('/admin/catalogs/clients'),
  contracts: (clientId) =>
    apiRequest(`/admin/catalogs/contracts${clientId ? `?clientId=${clientId}` : ''}`),
  departments: () => apiRequest('/admin/catalogs/departments'),
  states: () => apiRequest('/admin/catalogs/states'),
  cities: (stateId) =>
    apiRequest(`/admin/catalogs/cities${stateId ? `?stateId=${stateId}` : ''}`),
  units: () => apiRequest('/admin/catalogs/units'),
}
