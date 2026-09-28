import api from './axios'

// Mismo baseURL que axios.js: en dev es el proxy relativo "/api", en prod VITE_API_URL.
// navigator.sendBeacon no puede usar la instancia de axios (no soporta sus interceptores),
// asi que arma la URL absoluta/relativa por su cuenta.
const API_BASE = import.meta.env.VITE_API_URL || '/api'

export const recordPageView = (data) => api.post('/public/analytics/pageview', data)

/** Reporta cuantos segundos permanecio el visitante en la pagina. Usa sendBeacon porque se
 * llama al salir/navegar de la pagina, cuando una peticion normal podria cancelarse. */
export function sendPageViewDuration(id, durationSeconds) {
  if (!id) return
  const url = `${API_BASE}/public/analytics/pageview/${id}/duration`
  const payload = JSON.stringify({ durationSeconds })
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }))
  } else {
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {})
  }
}

export const getAnalyticsSummary = () => api.get('/admin/analytics/summary')
