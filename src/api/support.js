import api from './axios'

export const createSupportTicket = (data) => api.post('/support/tickets', data)
export const getMySupportTickets = (params) => api.get('/support/tickets/mine', { params })

export const adminListSupportTickets = (params) => api.get('/admin/support/tickets', { params })
export const adminResolveSupportTicket = (id, data) => api.patch(`/admin/support/tickets/${id}/resolve`, data)
