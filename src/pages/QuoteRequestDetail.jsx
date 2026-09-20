import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getMyQuoteRequestDetail, cancelQuoteRequest, chooseQuote } from '../api/quoteRequests'
import { useNotify } from '../context/NotifyContext'
import RatingStars from '../components/RatingStars'
import TrustBadge from '../components/TrustBadge'
import { formatCurrency, formatDate, formatResponseTime } from '../utils/format'

const RECIPIENT_STATUS_STYLES = {
  COTIZO: 'bg-green-100 text-green-700',
  PENDIENTE: 'bg-amber-100 text-amber-800',
  DESCARTADO: 'bg-gray-100 text-gray-500',
}
const RECIPIENT_STATUS_LABELS = { COTIZO: 'Cotizo', PENDIENTE: 'Esperando', DESCARTADO: 'Descarto' }
const RECIPIENT_NAME_STYLES = {
  COTIZO: 'text-gray-900 font-semibold',
  PENDIENTE: 'text-gray-400',
  DESCARTADO: 'text-gray-400',
}

export default function QuoteRequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notify, confirmDialog } = useNotify()
  const [quoteRequest, setQuoteRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)

  function load() {
    setLoading(true)
    getMyQuoteRequestDetail(id).then((r) => setQuoteRequest(r.data.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  async function handleCancel() {
    const ok = await confirmDialog('¿Seguro que quieres cancelar esta solicitud de cotizacion?', { title: 'Cancelar solicitud' })
    if (!ok) return
    setWorking(true)
    try {
      await cancelQuoteRequest(id)
      notify('Solicitud cancelada', 'success')
      load()
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo cancelar', 'error')
    } finally {
      setWorking(false)
    }
  }

  async function handleChoose(quoteId) {
    const ok = await confirmDialog('¿Elegir esta cotizacion? Se creara una contratacion real con este prestador.', { title: 'Elegir cotizacion', danger: false, confirmText: 'Elegir' })
    if (!ok) return
    setWorking(true)
    try {
      const res = await chooseQuote(id, quoteId)
      notify('Cotizacion elegida, contratacion creada', 'success')
      navigate(`/mis-contrataciones/${res.data.data.id}`)
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo elegir esta cotizacion', 'error')
    } finally {
      setWorking(false)
    }
  }

  if (loading) return <div className="container-app py-12 text-gray-500">Cargando...</div>
  if (!quoteRequest) return <div className="container-app py-12 text-gray-500">Solicitud no encontrada.</div>

  const quotedCount = quoteRequest.recipients.filter((r) => r.status === 'COTIZO').length

  return (
    <div className="container-app py-8 max-w-2xl mx-auto">
      <Link to="/cotizaciones" className="text-sm text-primary-700 hover:underline">← Mis cotizaciones</Link>

      <div className="card p-6 mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
          <h1 className="text-lg font-bold text-gray-900">{quoteRequest.categoryName}</h1>
          {quoteRequest.status === 'ABIERTA' && (
            <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">Esperando cotizaciones</span>
          )}
          {quoteRequest.status === 'CERRADA' && (
            <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">Cerrada</span>
          )}
          {quoteRequest.status === 'EXPIRADA' && (
            <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">Expirada</span>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-4">{quoteRequest.description}</p>
        <p className="text-xs text-gray-400 mb-6">{quoteRequest.city} · Solicitada el {formatDate(quoteRequest.createdAt)}</p>

        {quoteRequest.status === 'CERRADA' && quoteRequest.resultingBookingId && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-6 flex items-center justify-between gap-3">
            <span className="text-sm text-green-800">Ya elegiste una cotizacion y se creo tu contratacion.</span>
            <Link to={`/mis-contrataciones/${quoteRequest.resultingBookingId}`} className="btn-primary text-sm shrink-0">Ver contratacion</Link>
          </div>
        )}

        {quoteRequest.status === 'EXPIRADA' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-6 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-sm text-gray-600">Esta solicitud ya se cerro sin que eligieras ninguna cotizacion.</span>
            <Link to="/cotizaciones/nueva" className="btn-secondary text-sm shrink-0">Solicitar de nuevo</Link>
          </div>
        )}

        {quoteRequest.status === 'ABIERTA' && (
          <>
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 12l3 3 5-6"></path></svg>
              <span className="text-base font-bold text-gray-900">Solicitud enviada</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Se envio a los {quoteRequest.recipients.length} prestadores de {quoteRequest.categoryName} mejor calificados cerca de ti (mismo criterio que "Recomendados" en la busqueda).
            </p>

            <div className="flex flex-col gap-3 mb-4">
              {quoteRequest.recipients.map((r) => (
                <div key={r.providerId} className="flex items-center justify-between border border-gray-100 rounded-xl shadow-sm px-4 py-3 text-sm">
                  <span className={RECIPIENT_NAME_STYLES[r.status]}>{r.providerBusinessName}</span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${RECIPIENT_STATUS_STYLES[r.status]}`}>{RECIPIENT_STATUS_LABELS[r.status]}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mb-6">
              {quotedCount} de {quoteRequest.recipients.length} ya cotizaron · se cierra en 24 hrs o cuando elijas una.
            </p>
          </>
        )}

        {quoteRequest.quotes.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Compara y elige</h2>
            <div className="flex flex-col gap-3 mb-6">
              {quoteRequest.quotes.map((q, i) => (
                <div key={q.id} className={`border rounded-xl p-4 ${i === 0 && quoteRequest.status === 'ABIERTA' ? 'border-primary-600 bg-primary-50/40' : 'border-gray-100'}`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-gray-900 truncate">{q.providerBusinessName}</span>
                      <TrustBadge tier={q.providerTrustTier} />
                    </div>
                    <span className="font-bold text-gray-900 shrink-0">{formatCurrency(q.price)}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <RatingStars value={q.providerAverageRating} size="text-xs" />
                    <span className="text-xs text-gray-500">({q.providerTotalReviews ?? 0})</span>
                    {formatResponseTime(q.providerAverageResponseMinutes) && (
                      <span className="text-xs text-gray-500">· Responde en {formatResponseTime(q.providerAverageResponseMinutes)}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{q.serviceTitle} · Disponible: {formatDate(q.availableAt)}</p>
                  {q.note && <p className="text-xs text-gray-500 italic mb-2">"{q.note}"</p>}
                  {q.status === 'ENVIADA' && quoteRequest.status === 'ABIERTA' && (
                    <button onClick={() => handleChoose(q.id)} disabled={working} className="btn-primary text-sm w-full mt-2">
                      Elegir a {q.providerBusinessName}
                    </button>
                  )}
                  {q.status === 'ELEGIDA' && (
                    <span className="inline-block text-xs font-semibold text-green-700 mt-1">✓ Elegida</span>
                  )}
                  {q.status === 'DESCARTADA' && (
                    <span className="inline-block text-xs text-gray-400 mt-1">No elegida</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {quoteRequest.status === 'ABIERTA' && (
          <button onClick={handleCancel} disabled={working} className="btn-danger text-sm w-full">
            Cancelar solicitud
          </button>
        )}
      </div>
    </div>
  )
}
