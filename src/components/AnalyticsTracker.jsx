import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { recordPageView, sendPageViewDuration } from '../api/analytics'

const VISITOR_ID_KEY = 'nexjob_visitor_id'

function getVisitorId() {
  let id = localStorage.getItem(VISITOR_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(VISITOR_ID_KEY, id)
  }
  return id
}

/**
 * Registra visitas anonimas para la analitica del admin (ver AdminAnalytics.jsx): no depende de
 * que el visitante inicie sesion, solo de un id anonimo guardado en su navegador. Se monta una
 * sola vez en la raiz de la app (ver App.jsx) para verlo aunque el usuario nunca inicie sesion.
 * No renderiza nada.
 */
export default function AnalyticsTracker() {
  const location = useLocation()
  const currentRef = useRef(null) // { id, startedAt }

  useEffect(() => {
    const previous = currentRef.current
    if (previous) {
      sendPageViewDuration(previous.id, Math.round((Date.now() - previous.startedAt) / 1000))
      currentRef.current = null
    }

    let cancelled = false
    recordPageView({ visitorId: getVisitorId(), path: location.pathname, referrer: document.referrer || null })
      .then((res) => {
        if (!cancelled) currentRef.current = { id: res.data.data.id, startedAt: Date.now() }
      })
      .catch(() => {})

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  // Cubre el caso de cerrar la pestana/navegador directamente (no solo navegar dentro de la SPA).
  useEffect(() => {
    function handlePageHide() {
      const current = currentRef.current
      if (current) sendPageViewDuration(current.id, Math.round((Date.now() - current.startedAt) / 1000))
    }
    window.addEventListener('pagehide', handlePageHide)
    return () => window.removeEventListener('pagehide', handlePageHide)
  }, [])

  return null
}
