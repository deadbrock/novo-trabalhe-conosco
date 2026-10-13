import { apiRequest } from './api'

export const publicJobsService = {
  list() {
    return apiRequest('/public/jobs')
  },
  getBySlug(slug) {
    return apiRequest(`/public/jobs/${slug}`)
  },
}

export const candidateApplicationsService = {
  apply(jobId, token) {
    return apiRequest('/candidate/applications', {
      method: 'POST',
      body: { jobId },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
  },
}
