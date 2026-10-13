import { apiRequest } from './api'

export const cmsService = {
  getAll() {
    return apiRequest('/public/cms')
  },

  getSection(slug) {
    return apiRequest(`/public/cms/${slug}`)
  },
}
