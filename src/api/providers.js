import api from './axios'

export const searchProviders = (params) => api.get('/public/providers', { params })
export const getProviderDetail = (id) => api.get(`/public/providers/${id}`)
export const getPublicService = (id) => api.get(`/public/services/${id}`)
export const getProviderBusySlots = (id, params) => api.get(`/public/providers/${id}/busy-slots`, { params })

export const getMyProviderProfile = () => api.get('/provider/profile')
export const updateMyProviderProfile = (data) => api.put('/provider/profile', data)
export const uploadMyProviderImage = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/provider/profile/image', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const adminListProviders = (params) => api.get('/admin/providers', { params })
export const adminSetProviderVerified = (id, value) => api.patch(`/admin/providers/${id}/verified`, { value })
