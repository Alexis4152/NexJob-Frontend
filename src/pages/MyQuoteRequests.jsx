import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyQuoteRequests } from '../api/quoteRequests'
import { formatDate } from '../utils/format'

const STATUS_STYLES = {
  ABIERTA: 'bg-amber-100 text-amber-800',
  CERRADA: 'bg-green-100 text-green-700',
  EXPIRADA: 'bg-gray-100 text-gray-500',
}
const STATUS_LABELS = { ABIERTA: 'Esperando cotizaciones', CERRADA: 'Cerrada', EXPIRADA: 'Expirada' }

export default function MyQuoteRequests() {
  const [result, setResult] = useState({ content: [], totalPages: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyQuoteRequests({ size: 20 }).then((r) => setResult(r.data.data)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="container-app py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Mis cotizaciones</h1>
        <Link to="/cotizaciones/nueva" className="btn-primary text-sm">Solicitar cotizaciones</Link>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Cargando...</p>
      ) : result.content.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500 text-sm mb-4">Aun no has solicitado ninguna cotizacion.</p>
          <Link to="/cotizaciones/nueva" className="btn-primary text-sm">Solicitar cotizaciones</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {result.content.map((q) => (
            <Link key={q.id} to={`/cotizaciones/${q.id}`} className="card p-4 flex items-center justify-between gap-3 hover:shadow-md transition-shadow">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{q.categoryName}</p>
                <p className="text-sm text-gray-500 truncate">{q.description}</p>
                <p className="text-xs text-gray-400 mt-1">{q.city} · {formatDate(q.createdAt)} · {q.quotesCount} de {q.recipientsCount} cotizaron</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLES[q.status]}`}>{STATUS_LABELS[q.status]}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
