import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { adminListBookings } from '../../api/bookings'
import StatusBadge from '../../components/StatusBadge'
import AdminPagination from '../../components/AdminPagination'
import { formatCurrency, formatDate } from '../../utils/format'

const STATUSES = ['', 'SOLICITADO', 'ACEPTADO', 'EN_PROCESO', 'CONCLUIDO', 'APROBADO', 'RECHAZADO', 'CANCELADO']

export default function AdminBookings() {
  const [params, setParams] = useSearchParams()
  const [filters, setFilters] = useState({ q: '', status: params.get('status') || '' })
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [result, setResult] = useState({ content: [], totalPages: 0, totalElements: 0 })
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    adminListBookings({ status: filters.status || undefined, q: filters.q || undefined, page, size })
      .then((r) => setResult(r.data.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, size, filters])

  function handleSubmit(e) {
    e.preventDefault()
    setPage(0)
    setParams(filters.status ? { status: filters.status } : {})
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Contrataciones</h1>

      <form onSubmit={handleSubmit} className="card p-4 mb-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-gray-600 block mb-1">Folio, servicio o prestador</label>
          <input className="input" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        </div>
        <div className="min-w-[180px]">
          <label className="text-xs font-medium text-gray-600 block mb-1">Estado</label>
          <select className="input" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            {STATUSES.map((s) => <option key={s} value={s}>{s || 'Todos los estados'}</option>)}
          </select>
        </div>
        <button type="submit" className="btn-primary text-sm">Filtrar</button>
      </form>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <p className="text-gray-500 text-sm p-4">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Folio</th>
                  <th className="px-4 py-3 font-medium">Servicio</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Prestador</th>
                  <th className="px-4 py-3 font-medium text-right">Precio</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {result.content.map((b) => (
                  <tr key={b.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-900">{b.folio}</td>
                    <td className="px-4 py-3 text-gray-600">{b.serviceTitle}</td>
                    <td className="px-4 py-3 text-gray-600">{b.clientFullName}</td>
                    <td className="px-4 py-3 text-gray-600">{b.providerBusinessName}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(b.agreedPrice)}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/admin/contrataciones/${b.id}`} className="text-primary-700 hover:underline">Ver</Link>
                    </td>
                  </tr>
                ))}
                {result.content.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Sin contrataciones con ese filtro.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <AdminPagination
          page={result.page} size={size} totalPages={result.totalPages} totalElements={result.totalElements}
          contentLength={result.content.length} onPageChange={setPage} onSizeChange={(s) => { setSize(s); setPage(0) }}
        />
      </div>
    </div>
  )
}
