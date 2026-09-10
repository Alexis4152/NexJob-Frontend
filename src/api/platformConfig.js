import api from './axios'

export const getPlatformConfig = () => api.get('/public/platform-config')

export const adminGetPlatformConfig = () => api.get('/admin/platform-config')
export const adminUpdatePlatformConfig = (data) => api.put('/admin/platform-config', data)
export const adminUploadPlatformLogo = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/admin/platform-config/logo', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const adminGetEmailConfig = () => api.get('/admin/email-config')
export const adminUpdateEmailConfig = (data) => api.put('/admin/email-config', data)
