import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePlatformConfig } from '../context/PlatformConfigContext'

const LINKS = [
  { to: '/prestador', end: true, icon: '🗂️', label: 'Tablero de trabajos' },
  { to: '/prestador/servicios', icon: '🧰', label: 'Mis servicios' },
  { to: '/prestador/calendario', icon: '📅', label: 'Calendario' },
  { to: '/prestador/resenas', icon: '⭐', label: 'Resenas' },
  { to: '/prestador/perfil', icon: '👤', label: 'Mi perfil' },
]

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    isActive ? 'bg-primary-600/20 text-primary-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'
  }`

/** Shell del panel del prestador de servicio: tablero Kanban de contrataciones, catalogo de
 * servicios que ofrece y su perfil publico. */
export default function ProviderLayout() {
  const { user, logout } = useAuth()
  const { config } = usePlatformConfig()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center font-bold text-white">
            {(config?.platformName || 'N')[0]}
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">{config?.platformName || 'NexJob'}</p>
            <p className="text-xs text-slate-400">Panel de prestador</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={navLinkClass} onClick={() => setDrawerOpen(false)}>
            <span>{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <NavLink to="/" className="block text-xs text-slate-400 hover:text-white mb-2">← Volver a la plataforma</NavLink>
        <p className="text-xs text-slate-500 mb-2">{user?.firstName} {user?.lastName}</p>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          🚪 Cerrar sesion
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="hidden lg:flex w-64 bg-gray-900 flex-col shrink-0">{sidebarContent}</aside>

      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <aside className="relative w-64 bg-gray-900 flex flex-col h-full">{sidebarContent}</aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 bg-white border-b border-gray-200 px-4 py-3">
          <button onClick={() => setDrawerOpen(true)} className="p-2 text-gray-600" aria-label="Abrir menu">☰</button>
          <span className="font-semibold text-gray-800">Panel de prestador</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
