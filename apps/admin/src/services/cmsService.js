import { apiRequest } from './api'

export const cmsService = {
  listSections() {
    return apiRequest('/admin/cms/sections')
  },

  getSection(slug) {
    return apiRequest(`/admin/cms/sections/${slug}`)
  },

  saveDraft(slug, payload) {
    return apiRequest(`/admin/cms/sections/${slug}/draft`, {
      method: 'PUT',
      body: { payload },
    })
  },

  publish(slug, payload) {
    return apiRequest(`/admin/cms/sections/${slug}/publish`, {
      method: 'POST',
      body: payload ? { payload } : {},
    })
  },
}
