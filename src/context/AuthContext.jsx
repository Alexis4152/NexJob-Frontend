import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, register as apiRegister, registerProvider as apiRegisterProvider, me as apiMe } from '../api/auth'

const AuthContext = createContext(null)

/**
 * Fuente central de verdad de la sesion: mantiene `user` en memoria sincronizado con
 * localStorage (`nexjob_token`/`nexjob_user`) y expone login/register/registerProvider/logout
 * e `isAdmin`/`isProvider`/`isClient`. Al montar, restaura la sesion guardada de inmediato
 * (evita parpadeos de UI) y en paralelo llama a `/auth/me` para refrescar el perfil.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('nexjob_user')
    const token = localStorage.getItem('nexjob_token')
    if (stored && token) {
      try {
        const parsed = JSON.parse(stored)
        setUser(parsed)
        apiMe()
          .then((r) => {
            const fresh = r.data.data
            localStorage.setItem('nexjob_user', JSON.stringify(fresh))
            setUser(fresh)
          })
          .catch(() => {})
      } catch {
        logout()
      }
    }
    setLoading(false)
  }, [])

  function persist(data) {
    const { token, user: userData } = data
    localStorage.setItem('nexjob_token', token)
    localStorage.setItem('nexjob_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  async function login(email, password) {
    const res = await apiLogin({ email, password })
    return persist(res.data.data)
  }

  async function register(payload) {
    const res = await apiRegister(payload)
    return persist(res.data.data)
  }

  async function registerProvider(payload) {
    const res = await apiRegisterProvider(payload)
    return persist(res.data.data)
  }

  function logout() {
    localStorage.removeItem('nexjob_token')
    localStorage.removeItem('nexjob_user')
    setUser(null)
  }

  function updateUserInMemory(partial) {
    setUser((prev) => {
      const merged = { ...prev, ...partial }
      localStorage.setItem('nexjob_user', JSON.stringify(merged))
      return merged
    })
  }

  const isAdmin = user?.role === 'ADMIN'
  const isProvider = user?.role === 'PROVIDER'
  const isClient = user?.role === 'CLIENT'

  return (
    <AuthContext.Provider value={{ user, login, register, registerProvider, logout, isAdmin, isProvider, isClient, loading, updateUserInMemory }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
