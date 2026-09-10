import api from './axios'

// ── Cliente ──────────────────────────────────────────────────
export const createBooking = (data) => api.post('/bookings', data)
export const getMyBookings = (params) => api.get('/bookings/mine', { params })
export const getMyBookingDetail = (id) => api.get(`/bookings/${id}`)
export const cancelBooking = (id, reason) => api.patch(`/bookings/${id}/cancel`, { reason })
export const approveBooking = (id, { cardNumber, file } = {}) => {
  const form = new FormData()
  if (cardNumber) form.append('cardNumber', cardNumber)
  if (file) form.append('file', file)
  return api.post(`/bookings/${id}/approve`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export const reviewBooking = (id, data) => api.post(`/bookings/${id}/review`, data)

// ── Prestador ────────────────────────────────────────────────
export const getProviderBoard = () => api.get('/provider/bookings')
export const getProviderBookingDetail = (id) => api.get(`/provider/bookings/${id}`)
export const updateBookingStatus = (id, newStatus, note) => api.patch(`/provider/bookings/${id}/status`, { newStatus, note })
export const uploadBookingEvidence = (id, file, description) => {
  const form = new FormData()
  form.append('file', file)
  if (description) form.append('description', description)
  return api.post(`/provider/bookings/${id}/evidence`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export const getProviderDashboard = () => api.get('/provider/dashboard')
export const getProviderCalendar = (params) => api.get('/provider/bookings/calendar', { params })

// ── Admin ────────────────────────────────────────────────────
export const adminListBookings = (params) => api.get('/admin/bookings', { params })
export const adminGetBookingDetail = (id) => api.get(`/admin/bookings/${id}`)
export const adminGetDashboard = () => api.get('/admin/dashboard')
