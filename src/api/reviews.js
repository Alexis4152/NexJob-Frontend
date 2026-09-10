import api from './axios'

export const getMyReviews = (params) => api.get('/provider/reviews', { params })
