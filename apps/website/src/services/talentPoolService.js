import { apiUpload } from '@/services/apiUpload'

export const talentPoolService = {
  submit(formData) {
    return apiUpload('/talent-pool', { formData })
  },
}
