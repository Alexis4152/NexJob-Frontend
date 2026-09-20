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
          <p className="text-gray-600 max-w-xl mx-auto mb-10">
            Carpinteros, plomeros, electricistas y mas — elige como quieres encontrarlos.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto text-left">
            <div className="card p-6">
              <div className="w-11 h-11 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              <h2 className="text-base font-bold text-gray-900 mb-1">Buscar y elegir yo mismo</h2>
              <p className="text-sm text-gray-500 mb-4">Explora prestadores, compara calificaciones, reseñas e insignias de confianza, y contrata directo al que mas te convenza.</p>
              <form onSubmit={handleSearch} className="flex gap-2 mb-3">
                <input
                  className="input"
                  placeholder="¿Que servicio necesitas? Ej. plomero, pintor..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <button type="submit" className="btn-primary shrink-0">Buscar</button>
              </form>
              <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">Ideal si ya sabes que buscas</span>
            </div>

            <div className="card p-6 relative">
              <div className="w-11 h-11 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect></svg>
              </div>
              <h2 className="text-base font-bold text-gray-900 mb-1">Pedir cotizaciones</h2>
              <p className="text-sm text-gray-500 mb-4">Describe lo que necesitas una vez y recibe precio y disponibilidad de varios prestadores para comparar antes de elegir.</p>
              <Link to="/cotizaciones/nueva" className="btn-primary w-full mb-3 block text-center">
                Solicitar cotizaciones
              </Link>
              <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">Ideal si quieres comparar precio</span>
            </div>
          </div>
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

      <section className="bg-gray-50">
        <div className="container-app py-12">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <h2 className="text-xl font-bold text-gray-900">¿Como funciona pedir cotizaciones?</h2>
            <Link to="/cotizaciones/nueva" className="text-sm text-primary-700 hover:underline">Probarlo →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold mb-3">1</div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Describe tu necesidad</h3>
              <p className="text-xs text-gray-500">Categoria, breve descripcion y tu ubicacion. Un solo formulario.</p>
            </div>
            <div className="card p-5">
              <div className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold mb-3">2</div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Recibe varias cotizaciones</h3>
              <p className="text-xs text-gray-500">Se envia a los prestadores mejor calificados cerca de ti.</p>
            </div>
            <div className="card p-5">
              <div className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold mb-3">3</div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Compara y elige</h3>
              <p className="text-xs text-gray-500">Precio, calificacion y disponibilidad, uno al lado del otro.</p>
            </div>
          </div>
        </div>
      </section>

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
