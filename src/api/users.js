import api from './axios'

export const adminListUsers = (params) => api.get('/admin/users', { params })
export const adminSetUserActive = (id, value) => api.patch(`/admin/users/${id}/active`, { value })
