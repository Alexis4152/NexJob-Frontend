import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProviderQuoteRequestDetail, submitQuote, declineQuoteRequest } from '../../api/quoteRequests'
import { listMyServices } from '../../api/services'
import { useNotify } from '../../context/NotifyContext'
import { formatCurrency, formatDateSlash } from '../../utils/format'

const PRICE_TYPE_LABELS = { FIJO: 'precio fijo', POR_HORA: 'por hora', COTIZACION: 'a cotizar' }

export default function ProviderQuoteRequestDetail() {
  const { id } = useParams()
  const { notify, confirmDialog } = useNotify()
  const [quoteRequest, setQuoteRequest] = useState(null)
  const [myServices, setMyServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [form, setForm] = useState({ serviceOfferingId: '', price: '', availableAt: '', note: '' })
  const [priceFocused, setPriceFocused] = useState(false)

  function load() {
    setLoading(true)
    getProviderQuoteRequestDetail(id).then((r) => setQuoteRequest(r.data.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  useEffect(() => {
    if (!quoteRequest || quoteRequest.myQuote || quoteRequest.myDeclined) return
    listMyServices({ size: 100 }).then((r) => {
      setMyServices(r.data.data.content.filter((s) => s.categoryId === quoteRequest.categoryId && s.isActive))
    })
  }, [quoteRequest])

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function handlePriceChange(e) {
    const raw = e.target.value.replace(/[^0-9.]/g, '')
    setForm((f) => ({ ...f, price: raw }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setWorking(true)
    try {
      await submitQuote(id, { ...form, serviceOfferingId: Number(form.serviceOfferingId), price: Number(form.price) })
      notify('Cotizacion enviada', 'success')
      load()
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo enviar la cotizacion', 'error')
    } finally {
      setWorking(false)
    }
  }

  async function handleDecline() {
    const ok = await confirmDialog('¿Descartar esta solicitud? No podras cotizarla despues.', { title: 'Descartar solicitud' })
    if (!ok) return
    setWorking(true)
    try {
      await declineQuoteRequest(id)
      notify('Solicitud descartada', 'success')
      load()
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo descartar', 'error')
    } finally {
      setWorking(false)
    }
  }

  if (loading) return <div className="text-gray-500 text-sm">Cargando...</div>
  if (!quoteRequest) return <div className="text-gray-500 text-sm">Solicitud no encontrada.</div>

  const canRespond = !quoteRequest.myQuote && !quoteRequest.myDeclined && quoteRequest.requestStatus === 'ABIERTA'

  return (
    <div>
      <Link to="/prestador/cotizaciones" className="text-sm text-primary-700 hover:underline">← Solicitudes de cotizacion</Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-6">{quoteRequest.categoryName}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="card p-6 sm:p-8">
          {quoteRequest.myQuote && (
            <div className="border border-green-200 bg-green-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-800 mb-2">Ya enviaste tu cotizacion</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                <p><b>Servicio:</b> {quoteRequest.myQuote.serviceTitle}</p>
                <p><b>Precio:</b> {formatCurrency(quoteRequest.myQuote.price)}</p>
                <p><b>Disponibilidad:</b> {formatDateSlash(quoteRequest.myQuote.availableAt)}</p>
                {quoteRequest.myQuote.note && <p><b>Nota:</b> {quoteRequest.myQuote.note}</p>}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Estado: {quoteRequest.myQuote.status === 'ELEGIDA' ? '¡El cliente te eligio!' : quoteRequest.myQuote.status === 'DESCARTADA' ? 'El cliente eligio a otro prestador' : 'Esperando que el cliente decida'}
              </p>
            </div>
          )}

          {quoteRequest.myDeclined && !quoteRequest.myQuote && (
            <p className="text-sm text-gray-500">Descartaste esta solicitud.</p>
          )}

          {canRespond && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {myServices.length === 0 ? (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  No tienes servicios activos en la categoria "{quoteRequest.categoryName}". Publica uno para poder cotizar.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block text-sm">
                    <span className="block text-gray-700 mb-1 font-medium">Servicio con el que cotizas</span>
                    <select required className="input" value={form.serviceOfferingId} onChange={set('serviceOfferingId')}>
                      <option value="">Selecciona un servicio</option>
                      {myServices.map((s) => (
                        <option key={s.id} value={s.id}>{s.title} ({PRICE_TYPE_LABELS[s.priceType]})</option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="block text-gray-700 mb-1 font-medium">Tu precio</span>
                    <input
                      required
                      type="text"
                      inputMode="decimal"
                      className="input"
                      value={priceFocused ? form.price : (form.price ? formatCurrency(form.price) : '')}
                      onFocus={() => setPriceFocused(true)}
                      onBlur={() => setPriceFocused(false)}
                      onChange={handlePriceChange}
                    />
                  </label>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block text-sm">
                  <span className="block text-gray-700 mb-1 font-medium">Disponibilidad que ofreces</span>
                  <input required type="datetime-local" className="input" value={form.availableAt} onChange={set('availableAt')} />
                </label>

                <label className="block text-sm">
                  <span className="block text-gray-700 mb-1 font-medium">Nota (opcional)</span>
                  <textarea className="input" rows={1} placeholder="Incluye materiales de buena calidad..." value={form.note} onChange={set('note')} />
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button type="submit" disabled={working || myServices.length === 0} className="btn-primary flex-1">
                  {working ? 'Enviando...' : 'Enviar cotizacion'}
                </button>
                <button type="button" onClick={handleDecline} disabled={working} className="btn-secondary flex-1">
                  No puedo atender esto
                </button>
              </div>
            </form>
          )}

          {quoteRequest.requestStatus !== 'ABIERTA' && !quoteRequest.myQuote && !quoteRequest.myDeclined && (
            <p className="text-sm text-gray-500">Esta solicitud ya se cerro.</p>
          )}
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-6">
          <div className="card p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Detalles de la solicitud</h2>
            <div className="text-sm text-gray-700 space-y-1.5">
              <p><span className="font-semibold text-gray-900">Requerimientos:</span> "{quoteRequest.description}"</p>
              <p>{quoteRequest.city}</p>
              <p>Fecha orientativa del cliente: {formatDateSlash(quoteRequest.scheduledAt)}</p>
            </div>
          </div>

          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2.5 flex gap-2 items-start">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><rect x="3" y="11" width="18" height="10" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <span className="text-xs text-gray-500 leading-relaxed">Los datos de contacto del cliente se comparten solo si elige tu cotizacion.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
