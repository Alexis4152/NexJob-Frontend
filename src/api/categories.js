import api from './axios'

export const listCategories = () => api.get('/public/categories')
export const getServiceTypes = (categoryId) => api.get(`/public/categories/${categoryId}/service-types`)

export const adminListCategories = (params) => api.get('/admin/categories', { params })
export const adminCreateCategory = (data) => api.post('/admin/categories', data)
export const adminUpdateCategory = (id, data) => api.put(`/admin/categories/${id}`, data)
export const adminDeactivateCategory = (id) => api.delete(`/admin/categories/${id}`)
