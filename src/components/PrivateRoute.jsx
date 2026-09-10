import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Guard de rutas autenticadas. `role` restringe ademas a un rol especifico (ADMIN o
 * PROVIDER) — la proteccion real sigue estando en el Backend (SecurityConfig +
 * hasRole/autorizacion por dueno del recurso), esto solo evita el parpadeo de UI.
 */
export default function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-500">Cargando...</div>
  }
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}
