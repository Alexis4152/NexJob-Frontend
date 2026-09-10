import { Link } from 'react-router-dom'
import { usePlatformConfig } from '../context/PlatformConfigContext'

export default function Footer() {
  const { config } = usePlatformConfig()

  return (
    <footer className="bg-gray-900 text-gray-400 mt-16">
      <div className="container-app py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
        <div>
          <p className="text-white font-bold text-lg mb-2">{config?.platformName || 'NexJob'}</p>
          <p>{config?.welcomeMessage || 'Conectamos clientes con los mejores prestadores de servicios.'}</p>
        </div>
        <div>
          <p className="text-white font-semibold mb-2">Enlaces</p>
          <ul className="space-y-1">
            <li><Link to="/prestadores" className="hover:text-white">Buscar servicios</Link></li>
            <li><Link to="/registro-prestador" className="hover:text-white">Ofrece tus servicios</Link></li>
            <li><Link to="/ayuda" className="hover:text-white">Centro de ayuda</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-white font-semibold mb-2">Contacto</p>
          {config?.contactEmail && <p>{config.contactEmail}</p>}
          {config?.contactPhone && <p>{config.contactPhone}</p>}
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs">
        {config?.footerText || 'NexJob - Todos los derechos reservados'}
      </div>
    </footer>
  )
}
