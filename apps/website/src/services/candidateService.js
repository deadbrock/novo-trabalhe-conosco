import { apiRequest } from './api'
import { apiUpload, apiDownload } from './apiUpload'
import axios from 'axios'

export const candidateService = {
  getDashboard(token) {
    return apiRequest('/candidate/dashboard', { token })
  },

  getApplications(token) {
    return apiRequest('/candidate/applications', { token })
  },

  applyToJob(token, jobId) {
    return apiRequest('/candidate/applications', { method: 'POST', token, body: { jobId } })
  },

  updateProfile(token, payload) {
    return apiRequest('/candidate/profile', { method: 'PUT', token, body: payload })
  },

  uploadResume(token, file) {
    const formData = new FormData()
    formData.append('resume', file)
    return apiUpload('/candidate/resume', { token, formData })
  },

  downloadResume(token, filename) {
    return apiDownload('/candidate/resume', { token, filename })
  },

  deleteResume(token) {
    return apiRequest('/candidate/resume', { method: 'DELETE', token })
  },

  async getResumePreviewUrl(token) {
    const headers = {}
    if (token) headers.Authorization = `Bearer ${token}`

    const response = await axios.get('/api/candidate/resume?inline=true', {
      headers,
      responseType: 'blob',
    })

    return URL.createObjectURL(response.data)
  },

  getPreAdmissionCases(token) {
    return apiRequest('/candidate/pre-admission', { token })
  },

  getDocumentations(token) {
    return apiRequest('/candidate/documentation', { token })
  },

  uploadDocumentationDocument(token, documentationId, itemId, file) {
    const formData = new FormData()
    formData.append('document', file)
    return apiUpload(`/candidate/documentation/${documentationId}/items/${itemId}/upload`, { token, formData })
  },

  uploadPreAdmissionDocument(token, caseId, itemId, file) {
    const formData = new FormData()
    formData.append('document', file)
    return apiUpload(`/candidate/pre-admission/${caseId}/items/${itemId}/upload`, { token, formData })
  },
}
