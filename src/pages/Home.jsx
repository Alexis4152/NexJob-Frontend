import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listCategories } from '../api/categories'
import { searchProviders } from '../api/providers'
import ProviderCard from '../components/ProviderCard'
import { usePlatformConfig } from '../context/PlatformConfigContext'

export default function Home() {
  const { config } = usePlatformConfig()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [featured, setFeatured] = useState([])
  const [q, setQ] = useState('')

  useEffect(() => {
    listCategories().then((r) => setCategories(r.data.data))
    searchProviders({ sort: 'rating', size: 6 }).then((r) => setFeatured(r.data.data.content))
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    navigate(`/prestadores${q ? `?q=${encodeURIComponent(q)}` : ''}`)
  }

  return (
    <div>
      <section className="bg-gradient-to-b from-primary-50 to-white">
        <div className="container-app py-16 sm:py-24 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4">
            {config?.welcomeMessage || 'Encuentra al prestador de servicios ideal para tu hogar'}
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto mb-8">
            Carpinteros, plomeros, electricistas y mas — busca por categoria, compara calificaciones y agenda tu visita en minutos.
          </p>
          <form onSubmit={handleSearch} className="max-w-lg mx-auto flex gap-2">
            <input
              className="input"
              placeholder="¿Que servicio necesitas? Ej. plomero, pintor..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button type="submit" className="btn-primary shrink-0">Buscar</button>
          </form>
        </div>
      </section>

      <section className="container-app py-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Categorias populares</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/prestadores?categoryId=${c.id}`}
              className="card p-4 text-center hover:shadow-md transition-shadow"
            >
              <span className="text-3xl block mb-2">{c.icon}</span>
              <span className="text-sm font-medium text-gray-800">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="container-app py-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Prestadores mejor calificados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((p) => <ProviderCard key={p.id} provider={p} />)}
          </div>
        </section>
      )}

      <section className="bg-gray-900 text-white">
        <div className="container-app py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold mb-1">¿Ofreces un servicio?</h2>
            <p className="text-gray-400">Registrate como prestador y empieza a recibir contrataciones.</p>
          </div>
          <Link to="/registro-prestador" className="btn-primary shrink-0">Registrarme como prestador</Link>
        </div>
      </section>
    </div>
  )
}
