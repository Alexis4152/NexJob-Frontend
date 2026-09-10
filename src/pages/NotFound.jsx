import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container-app py-24 text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
      <p className="text-gray-500 mb-6">La pagina que buscas no existe.</p>
      <Link to="/" className="btn-primary">Volver al inicio</Link>
    </div>
  )
}
