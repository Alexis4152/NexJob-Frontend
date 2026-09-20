import api from './axios'

// ── Cliente ──────────────────────────────────────────────────
export const createQuoteRequest = (data) => api.post('/quote-requests', data)
export const getMyQuoteRequests = (params) => api.get('/quote-requests/mine', { params })
export const getMyQuoteRequestDetail = (id) => api.get(`/quote-requests/${id}`)
export const cancelQuoteRequest = (id) => api.patch(`/quote-requests/${id}/cancel`)
export const chooseQuote = (id, quoteId) => api.post(`/quote-requests/${id}/choose`, { quoteId })

// ── Prestador ────────────────────────────────────────────────
export const getProviderQuoteRequests = (params) => api.get('/provider/quote-requests', { params })
export const getProviderQuoteRequestDetail = (id) => api.get(`/provider/quote-requests/${id}`)
export const submitQuote = (id, data) => api.post(`/provider/quote-requests/${id}/quote`, data)
export const declineQuoteRequest = (id) => api.post(`/provider/quote-requests/${id}/decline`)
