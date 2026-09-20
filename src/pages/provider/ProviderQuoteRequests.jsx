import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProviderQuoteRequests } from '../../api/quoteRequests'
import { formatDate } from '../../utils/format'

const STATUS_STYLES = {
  PENDIENTE: 'bg-amber-100 text-amber-800',
  COTIZO: 'bg-green-100 text-green-700',
  ELEGIDA: 'bg-primary-100 text-primary-700',
  NO_ELEGIDA: 'bg-gray-100 text-gray-500',
  DESCARTADO: 'bg-gray-100 text-gray-500',
  CERRADA: 'bg-red-100 text-red-700',
}
const STATUS_LABELS = {
  PENDIENTE: 'Por responder',
  COTIZO: 'Ya cotizaste',
  ELEGIDA: 'Tu cotizacion fue elegida, Dar seguimiento →',
  NO_ELEGIDA: 'No fue elegida',
  DESCARTADO: 'Descartada',
  CERRADA: 'Cotizacion cerrada',
}

// Si el cliente cancelo/expiro la solicitud antes de que este prestador respondiera,
// ya no tiene caso decirle "Por responder" (no puede hacer nada con ella).
function displayStatus(q) {
  return q.requestStatus !== 'ABIERTA' && q.myStatus === 'PENDIENTE' ? 'CERRADA' : q.myStatus
}

export default function ProviderQuoteRequests() {
  const [result, setResult] = useState({ content: [], totalPages: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProviderQuoteRequests({ size: 20 }).then((r) => setResult(r.data.data)).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Solicitudes de cotizacion</h1>
      <p className="text-sm text-gray-500 mb-6">Clientes que quieren comparar precios antes de elegir. Responde con tu precio y disponibilidad, o descarta si no puedes atenderlo.</p>

      {loading ? (
        <p className="text-gray-500 text-sm">Cargando...</p>
      ) : result.content.length === 0 ? (
        <div className="card p-8 text-center text-gray-500 text-sm">Por ahora no tienes solicitudes de cotizacion.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {result.content.map((q) => {
            const status = displayStatus(q)
            const to = status === 'ELEGIDA' ? '/prestador' : `/prestador/cotizaciones/${q.id}`
            return (
              <Link key={q.id} to={to} className="card p-4 flex items-center justify-between gap-3 hover:shadow-md transition-shadow">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{q.categoryName}</p>
                  <p className="text-sm text-gray-500 truncate">{q.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{q.city} · {formatDate(q.createdAt)}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 text-right ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
