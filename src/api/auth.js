import api from './axios'

export const login = (data) => api.post('/auth/login', data)
export const register = (data) => api.post('/auth/register', data)
export const registerProvider = (data) => api.post('/auth/register-provider', data)
export const me = () => api.get('/auth/me')
export const updateMe = (data) => api.put('/users/me', data)
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email })
export const validateResetCode = (email, code) => api.post('/auth/validate-reset-code', { email, code })
export const resetPassword = (email, code, newPassword) => api.post('/auth/reset-password', { email, code, newPassword })
