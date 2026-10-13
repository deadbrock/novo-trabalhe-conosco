import { apiRequest } from './api'

export const pipelineService = {
  getBoard(params = {}) {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v)),
    ).toString()
    return apiRequest(`/admin/pipeline/board${query ? `?${query}` : ''}`)
  },
  getStagesConfig() {
    return apiRequest('/admin/pipeline/stages/config')
  },
  updateStages(stages) {
    return apiRequest('/admin/pipeline/stages', { method: 'PUT', body: { stages } })
  },
  getStages() {
    return apiRequest('/admin/pipeline/stages')
  },
  moveApplication(id, stageSlug) {
    return apiRequest(`/admin/pipeline/applications/${id}/stage`, {
      method: 'PATCH',
      body: { stageSlug },
    })
  },
}
