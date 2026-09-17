import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead } from '../api/notifications'
import { formatDate } from '../utils/format'

const POLL_INTERVAL_MS = 30000

export default function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [loaded, setLoaded] = useState(false)
  const containerRef = useRef(null)

  function refreshCount() {
    getUnreadNotificationCount().then((r) => setUnreadCount(r.data.data)).catch(() => {})
  }

  useEffect(() => {
    if (!user) return
    refreshCount()
    const interval = setInterval(refreshCount, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggleOpen() {
    const next = !open
    setOpen(next)
    if (next && !loaded) {
      getNotifications({ size: 10 }).then((r) => {
        setNotifications(r.data.data.content)
        setLoaded(true)
      }).catch(() => {})
    }
  }

  function handleMarkAllRead() {
    markAllNotificationsRead().then(() => {
      setUnreadCount(0)
      setNotifications((list) => list.map((n) => ({ ...n, isRead: true })))
    })
  }

  function handleSelect(n) {
    setOpen(false)
    if (!n.isRead) {
      markNotificationRead(n.id).then(() => {
        setUnreadCount((c) => Math.max(0, c - 1))
        setNotifications((list) => list.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)))
      })
    }
    if (n.link) navigate(n.link)
  }

  if (!user) return null

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={toggleOpen}
        className="relative p-2 -m-2 text-gray-600 hover:text-gray-900"
        aria-label="Notificaciones"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] font-bold leading-none rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-lg shadow-lg border border-gray-100 z-50">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">Notificaciones</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-primary-700 hover:underline">
                Marcar todas como leidas
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {!loaded && <p className="text-sm text-gray-400 text-center py-6">Cargando...</p>}
            {loaded && notifications.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No tienes notificaciones</p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleSelect(n)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 flex gap-2 ${!n.isRead ? 'bg-primary-50/40' : ''}`}
              >
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${!n.isRead ? 'bg-primary-600' : 'bg-transparent'}`} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-900">{n.title}</span>
                  <span className="block text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</span>
                  <span className="block text-[11px] text-gray-400 mt-1">{formatDate(n.createdAt)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
