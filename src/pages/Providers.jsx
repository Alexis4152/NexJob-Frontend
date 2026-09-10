import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listCategories } from '../api/categories'
import { searchProviders } from '../api/providers'
import ProviderCard from '../components/ProviderCard'
import Pagination from '../components/Pagination'

export default function Providers() {
  const [params, setParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [filters, setFilters] = useState({
    q: params.get('q') || '',
    categoryId: params.get('categoryId') || '',
    city: '',
    sort: 'reviews',
  })
  const [page, setPage] = useState(0)
  const [result, setResult] = useState({ content: [], totalPages: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { listCategories().then((r) => setCategories(r.data.data)) }, [])

  function load() {
    setLoading(true)
    searchProviders({
      q: filters.q || undefined,
      categoryId: filters.categoryId || undefined,
      city: filters.city || undefined,
      sort: filters.sort,
      page, size: 9,
    }).then((r) => setResult(r.data.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, filters])

  function handleFilterChange(patch) {
    setPage(0)
    setFilters((f) => ({ ...f, ...patch }))
    const next = { ...filters, ...patch }
    setParams({ ...(next.q && { q: next.q }), ...(next.categoryId && { categoryId: next.categoryId }) })
  }

  return (
    <div className="container-app py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Buscar prestadores de servicio</h1>

      <div className="card p-4 mb-6 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-gray-600 block mb-1">Buscar</label>
          <input className="input" placeholder="Nombre del servicio o prestador..." value={filters.q}
            onChange={(e) => handleFilterChange({ q: e.target.value })} />
        </div>
        <div className="min-w-[180px]">
          <label className="text-xs font-medium text-gray-600 block mb-1">Categoria</label>
          <select className="input" value={filters.categoryId} onChange={(e) => handleFilterChange({ categoryId: e.target.value })}>
            <option value="">Todas las categorias</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className="text-xs font-medium text-gray-600 block mb-1">Ciudad</label>
          <input className="input" placeholder="Ciudad" value={filters.city}
            onChange={(e) => handleFilterChange({ city: e.target.value })} />
        </div>
        <div className="min-w-[160px]">
          <label className="text-xs font-medium text-gray-600 block mb-1">Ordenar por</label>
          <select className="input" value={filters.sort} onChange={(e) => handleFilterChange({ sort: e.target.value })}>
            <option value="name">Nombre</option>
            <option value="rating">Mejor calificados</option>
            <option value="reviews">Mas resenas</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : result.content.length === 0 ? (
        <p className="text-gray-500">No encontramos prestadores con esos filtros.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {result.content.map((p) => <ProviderCard key={p.id} provider={p} />)}
        </div>
      )}

      <Pagination page={result.page ?? page} totalPages={result.totalPages} onPageChange={setPage} />
    </div>
  )
}
