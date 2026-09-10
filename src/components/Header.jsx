import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePlatformConfig } from '../context/PlatformConfigContext'

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${isActive ? 'text-primary-700' : 'text-gray-600 hover:text-gray-900'}`

export default function Header() {
  const { user, logout, isAdmin, isProvider } = useAuth()
  const { config } = usePlatformConfig()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  function handleLogout() {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="container-app flex items-center justify-between h-16 gap-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-gray-900 shrink-0">
          {config?.logoUrl ? (
            <img src={config.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <span className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center">N</span>
          )}
          {config?.platformName || 'NexJob'}
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/prestadores" className={navLinkClass}>Buscar servicios</NavLink>
          <NavLink to="/ayuda" className={navLinkClass}>Ayuda</NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setNavOpen((o) => !o)}
            className="md:hidden p-2 -mr-2 text-gray-600"
            aria-label="Abrir menu de navegacion"
          >
            ☰
          </button>
          {!user && (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Iniciar sesion</Link>
              <Link to="/registro" className="btn-primary text-sm">Registrarme</Link>
            </>
          )}
          {user && (
            <div className="relative">
              <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                  {user.firstName?.[0]?.toUpperCase()}
                </span>
                <span className="hidden sm:inline">{user.firstName}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-100 py-1 text-sm">
                  {isAdmin && <Link to="/admin" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Panel administrativo</Link>}
                  {isProvider && <Link to="/prestador" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Mi panel de prestador</Link>}
                  <Link to="/mis-contrataciones" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Mis contrataciones</Link>
                  <Link to="/mi-cuenta" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Mi cuenta</Link>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50">Cerrar sesion</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {navOpen && (
        <nav className="md:hidden border-t border-gray-100 px-4 py-3 flex flex-col gap-3">
          <NavLink to="/prestadores" className={navLinkClass} onClick={() => setNavOpen(false)}>Buscar servicios</NavLink>
          <NavLink to="/ayuda" className={navLinkClass} onClick={() => setNavOpen(false)}>Ayuda</NavLink>
        </nav>
      )}
    </header>
  )
}
