import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { login as apiLogin, register as apiRegister, registerProvider as apiRegisterProvider, me as apiMe, refreshToken as apiRefreshToken } from '../api/auth'

const AuthContext = createContext(null)

// Cuanto antes de que expire el token se avisa al usuario (ver SessionExpiryModal mas abajo).
const WARNING_LEAD_MS = 5 * 60 * 1000

function getTokenExpiryMs(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

/**
 * Fuente central de verdad de la sesion: mantiene `user` en memoria sincronizado con
 * localStorage (`nexjob_token`/`nexjob_user`) y expone login/register/registerProvider/logout
 * e `isAdmin`/`isProvider`/`isClient`. Al montar, restaura la sesion guardada de inmediato
 * (evita parpadeos de UI) y en paralelo llama a `/auth/me` para refrescar el perfil.
 *
 * Tambien programa, a partir del `exp` del JWT, un aviso unos minutos antes de que la sesion
 * expire y el cierre automatico exacto cuando expira (redirige a /login) -- sin esto, el
 * usuario solo se enteraba de la sesion vencida hasta que una accion fallaba con 401.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState('')
  const warningTimerRef = useRef(null)
  const expiryTimerRef = useRef(null)
  const countdownIntervalRef = useRef(null)

  const clearSessionTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    warningTimerRef.current = null
    expiryTimerRef.current = null
    countdownIntervalRef.current = null
  }, [])

  const forceLogoutExpired = useCallback(() => {
    clearSessionTimers()
    setSessionSecondsLeft(null)
    localStorage.removeItem('nexjob_token')
    localStorage.removeItem('nexjob_user')
    setUser(null)
    window.location.href = '/login'
  }, [clearSessionTimers])

  const scheduleSessionTimers = useCallback((token) => {
    clearSessionTimers()
    setSessionSecondsLeft(null)
    const expiryMs = getTokenExpiryMs(token)
    if (!expiryMs) return
    const msUntilExpiry = expiryMs - Date.now()

    if (msUntilExpiry <= 0) {
      forceLogoutExpired()
      return
    }

    const msUntilWarning = msUntilExpiry - WARNING_LEAD_MS
    if (msUntilWarning > 0) {
      warningTimerRef.current = setTimeout(() => {
        setSessionSecondsLeft(Math.round(WARNING_LEAD_MS / 1000))
      }, msUntilWarning)
    } else {
      setSessionSecondsLeft(Math.round(msUntilExpiry / 1000))
    }

    expiryTimerRef.current = setTimeout(forceLogoutExpired, msUntilExpiry)
  }, [clearSessionTimers, forceLogoutExpired])

  // Cuenta regresiva en vivo (solo visual) mientras se muestra el aviso.
  useEffect(() => {
    if (sessionSecondsLeft === null) return
    countdownIntervalRef.current = setInterval(() => {
      setSessionSecondsLeft((s) => (s === null ? null : Math.max(0, s - 1)))
    }, 1000)
    return () => clearInterval(countdownIntervalRef.current)
  }, [sessionSecondsLeft === null])

  useEffect(() => {
    const stored = localStorage.getItem('nexjob_user')
    const token = localStorage.getItem('nexjob_token')
    if (stored && token) {
      try {
        const parsed = JSON.parse(stored)
        setUser(parsed)
        scheduleSessionTimers(token)
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
    return clearSessionTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function persist(data) {
    const { token, user: userData } = data
    localStorage.setItem('nexjob_token', token)
    localStorage.setItem('nexjob_user', JSON.stringify(userData))
    setUser(userData)
    scheduleSessionTimers(token)
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

  // Pide un token nuevo sin volver a escribir la contrasena; solo funciona mientras el token
  // actual siga siendo valido (el backend lo exige). Si ya expiro justo antes de dar clic,
  // el 401 del interceptor de axios se encarga de mandar a /login igual.
  async function refreshSession() {
    setRefreshing(true)
    setRefreshError('')
    try {
      const res = await apiRefreshToken()
      persist(res.data.data)
    } catch (err) {
      setRefreshError(err.response?.data?.message || 'No se pudo renovar la sesion')
    } finally {
      setRefreshing(false)
    }
  }

  function logout() {
    clearSessionTimers()
    setSessionSecondsLeft(null)
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

  const minutes = sessionSecondsLeft !== null ? Math.floor(sessionSecondsLeft / 60) : 0
  const seconds = sessionSecondsLeft !== null ? sessionSecondsLeft % 60 : 0

  return (
    <AuthContext.Provider value={{ user, login, register, registerProvider, logout, isAdmin, isProvider, isClient, loading, updateUserInMemory }}>
      {children}

      {sessionSecondsLeft !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative">
            <button
              type="button"
              onClick={() => setSessionSecondsLeft(null)}
              className="absolute top-3 right-3 text-gray-300 hover:text-gray-500"
              aria-label="Cerrar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <h3 className="text-lg font-bold text-gray-900">Tu sesion esta por expirar</h3>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              Tu sesion terminara en <span className="font-semibold text-gray-900">{minutes}:{String(seconds).padStart(2, '0')}</span> minutos.
              Extiendela para seguir trabajando sin volver a escribir tu contrasena.
            </p>

            {refreshError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{refreshError}</p>
            )}

            <div className="flex flex-col gap-2">
              <button className="btn-primary w-full" disabled={refreshing} onClick={refreshSession}>
                {refreshing ? 'Renovando...' : 'Extender sesion'}
              </button>
              <button className="btn-secondary w-full" disabled={refreshing} onClick={forceLogoutExpired}>
                Iniciar sesion ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
