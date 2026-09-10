import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyBookings } from '../api/bookings'
import StatusBadge from '../components/StatusBadge'
import Pagination from '../components/Pagination'
import { formatCurrency, formatDate } from '../utils/format'

export default function MyBookings() {
  const [page, setPage] = useState(0)
  const [result, setResult] = useState({ content: [], totalPages: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getMyBookings({ page, size: 10 }).then((r) => setResult(r.data.data)).finally(() => setLoading(false))
  }, [page])

  return (
    <div className="container-app py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mis contrataciones</h1>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : result.content.length === 0 ? (
        <p className="text-gray-500">Aun no has contratado ningun servicio. <Link to="/prestadores" className="text-primary-700 hover:underline">Buscar prestadores</Link></p>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Folio</th>
                  <th className="px-4 py-3 font-medium">Servicio</th>
                  <th className="px-4 py-3 font-medium">Prestador</th>
                  <th className="px-4 py-3 font-medium">Visita</th>
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
                    <td className="px-4 py-3 text-gray-600">{b.providerBusinessName}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(b.scheduledAt)}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(b.agreedPrice)}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/mis-contrataciones/${b.id}`} className="text-primary-700 hover:underline">Ver</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={result.page ?? page} totalPages={result.totalPages} onPageChange={setPage} />
    </div>
  )
}
