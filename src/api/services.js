import api from './axios'

export const listMyServices = (params) => api.get('/provider/services', { params })
export const getMyService = (id) => api.get(`/provider/services/${id}`)
export const createMyService = (data) => api.post('/provider/services', data)
export const updateMyService = (id, data) => api.put(`/provider/services/${id}`, data)
export const deactivateMyService = (id) => api.delete(`/provider/services/${id}`)
export const reactivateMyService = (id) => api.patch(`/provider/services/${id}/activate`)
export const addMyServiceImage = (id, file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post(`/provider/services/${id}/images`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export const removeMyServiceImage = (id, imageId) => api.delete(`/provider/services/${id}/images/${imageId}`)
