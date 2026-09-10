import api from './axios'

export const login = (data) => api.post('/auth/login', data)
export const register = (data) => api.post('/auth/register', data)
export const registerProvider = (data) => api.post('/auth/register-provider', data)
export const me = () => api.get('/auth/me')
export const updateMe = (data) => api.put('/users/me', data)
