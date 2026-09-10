import axios from 'axios'

/** Instancia central de axios. En dev usa `/api` (proxy de Vite hacia el backend en
 * localhost:8082); en produccion usa VITE_API_URL (inyectada en build time). */
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexjob_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 401 fuera de /auth/login significa "sesion expirada/token invalido": se limpia la sesion
// y se redirige. Se excluye /auth/login porque ahi un 401 es "credenciales invalidas", no
// una sesion expirada, y no debe tapar el mensaje de error del formulario de login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRequest = err.config?.url?.includes('/auth/login')
    if (err.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('nexjob_token')
      localStorage.removeItem('nexjob_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
