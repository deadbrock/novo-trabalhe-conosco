import { apiClient, apiRequest } from './api'

function buildQuery(params = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, value]) => value != null && value !== '')),
  ).toString()
  return query ? `?${query}` : ''
}

export const analyticsService = {
  getOverview(period = '30d') {
    return apiRequest(`/admin/analytics/overview${buildQuery({ period })}`)
  },

  getFunnel(period = '30d') {
    return apiRequest(`/admin/analytics/funnel${buildQuery({ period })}`)
  },

  getByState(period = '30d') {
    return apiRequest(`/admin/analytics/by-state${buildQuery({ period })}`)
  },

  getStageDuration(period = '90d') {
    return apiRequest(`/admin/analytics/stage-duration${buildQuery({ period })}`)
  },

  getTrend(period = '30d') {
    return apiRequest(`/admin/analytics/trend${buildQuery({ period })}`)
  },

  async exportReport(report, period = '30d') {
    const response = await apiClient.get(`/admin/analytics/export${buildQuery({ report, period })}`, {
      responseType: 'blob',
    })

    const disposition = response.headers['content-disposition'] || ''
    const match = disposition.match(/filename="([^"]+)"/)
    const filename = match?.[1] || `${report}.csv`

    const url = window.URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}
