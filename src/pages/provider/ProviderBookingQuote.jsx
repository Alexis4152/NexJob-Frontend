import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getProviderBookingDetail, submitBookingQuote } from '../../api/bookings'
import { useNotify } from '../../context/NotifyContext'
import { formatCurrency } from '../../utils/format'
import BookingDescription from '../../components/BookingDescription'

const SUGGESTED_CONCEPTS = ['Entrega a domicilio', 'Instalacion en sitio', 'Servicio urgente / express', 'Garantia extendida']

let seq = 0
function newItem(concept = '') {
  return { id: seq++, concept, quantity: 1, unit: 'pieza', unitCost: '' }
}

export default function ProviderBookingQuote() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notify } = useNotify()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([newItem()])
  const [note, setNote] = useState('')
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getProviderBookingDetail(id).then((r) => setBooking(r.data.data)).finally(() => setLoading(false))
  }, [id])

  function updateItem(itemId, patch) {
    setItems((its) => its.map((it) => (it.id === itemId ? { ...it, ...patch } : it)))
  }

  function removeItem(itemId) {
    setItems((its) => its.filter((it) => it.id !== itemId))
  }

  function addItem() {
    setItems((its) => [...its, newItem()])
  }

  function addSuggested(label) {
    setItems((its) => [...its, { ...newItem(label), unit: 'servicio' }])
  }

  const total = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitCost) || 0), 0)

  async function handleSubmit(e) {
    e.preventDefault()
    const validItems = items.filter((it) => it.concept.trim())
    if (validItems.length === 0) {
      notify('Agrega al menos un concepto a la cotizacion', 'error')
      return
    }
    setSubmitting(true)
    try {
      await submitBookingQuote(id, {
        items: validItems.map((it) => ({ concept: it.concept, quantity: Number(it.quantity) || 1, unit: it.unit || 'pieza', unitCost: Number(it.unitCost) || 0 })),
        note: note || undefined,
        estimatedDeliveryDate: estimatedDeliveryDate || undefined,
      })
      notify('Cotizacion enviada al cliente', 'success')
      navigate(`/prestador/contrataciones/${id}`)
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo enviar la cotizacion', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p className="text-gray-500">Cargando...</p>
  if (!booking) return <p className="text-gray-500">Contratacion no encontrada.</p>

  if (booking.status !== 'SOLICITADO' || booking.priceType !== 'COTIZACION') {
    return (
      <div>
        <Link to={`/prestador/contrataciones/${id}`} className="text-sm text-primary-700 hover:underline">← Volver a la contratacion</Link>
        <p className="text-gray-500 mt-4">Esta contratacion ya no esta pendiente de cotizar.</p>
      </div>
    )
  }

  return (
    <div>
      <Link to="/prestador" className="text-sm text-primary-700 hover:underline">← Tablero de trabajos</Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-1">Arma tu cotizacion</h1>
      <p className="text-sm text-gray-500 mb-6">Desglosa los materiales, herramientas y mano de obra que necesita este trabajo especifico.</p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <form onSubmit={handleSubmit} className="card p-6">
          <div className="space-y-2 mb-3">
            {items.map((it) => (
              <div key={it.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <input
                    className="flex-1 input"
                    placeholder="Concepto o material"
                    value={it.concept}
                    onChange={(e) => updateItem(it.id, { concept: e.target.value })}
                  />
                  <input
                    type="number" min="0" step="0.5"
                    className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={it.quantity}
                    onChange={(e) => updateItem(it.id, { quantity: e.target.value })}
                  />
                  <input
                    className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="unidad"
                    value={it.unit}
                    onChange={(e) => updateItem(it.id, { unit: e.target.value })}
                  />
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                    <input
                      type="number" min="0"
                      className="w-24 border border-gray-300 rounded-lg pl-5 pr-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                      value={it.unitCost}
                      onChange={(e) => updateItem(it.id, { unitCost: e.target.value })}
                    />
                  </div>
                  <span className="w-24 text-sm font-medium text-gray-900 text-right pt-2 shrink-0">
                    {formatCurrency((Number(it.quantity) || 0) * (Number(it.unitCost) || 0))}
                  </span>
                  <button type="button" onClick={() => removeItem(it.id)} className="text-gray-300 hover:text-red-500 shrink-0 mt-2.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={addItem} className="text-sm text-primary-700 hover:underline inline-flex items-center gap-1 mb-4">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Agregar material o concepto
          </button>

          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Conceptos frecuentes</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_CONCEPTS.map((c) => (
                <button key={c} type="button" onClick={() => addSuggested(c)} className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 hover:border-primary-400 hover:text-primary-700 inline-flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  {c}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Da clic agrega la fila con ese concepto para que solo captures el costo.</p>
          </div>

          <div className="border-t border-gray-100 pt-4 flex justify-end mb-6">
            <div className="w-full sm:w-64 space-y-1 text-sm">
              <div className="flex justify-between font-bold text-gray-900 text-base pt-1"><span>Total</span><span>{formatCurrency(total)}</span></div>
            </div>
          </div>

          <label className="block text-sm mb-4">
            <span className="block text-gray-700 mb-1 font-medium">
              ¿En cuanto tiempo terminarias o entregarias el trabajo? <span className="text-gray-400 font-normal">(opcional)</span>
            </span>
            <input
              type="date"
              className="input"
              min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
              value={estimatedDeliveryDate}
              onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
            />
            <span className="block text-xs text-gray-400 mt-1">Es solo una estimacion para que el cliente decida si le sirve el tiempo; la fecha real de la visita se acuerda hasta que acepte.</span>
          </label>

          <label className="block text-sm mb-6">
            <span className="block text-gray-700 mb-1 font-medium">Nota para el cliente <span className="text-gray-400 font-normal">(opcional)</span></span>
            <textarea className="input" rows={2} placeholder="Ej. Cotizacion valida por 5 dias. Incluye entrega e instalacion." value={note} onChange={(e) => setNote(e.target.value)} />
          </label>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Enviando...' : 'Enviar cotizacion al cliente'}
          </button>
        </form>

        <div className="flex flex-col gap-4 lg:sticky lg:top-6">
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Requerimientos del cliente</h3>
            <div className="text-sm text-gray-600 mb-3">
              <span className="text-gray-400">Cliente: </span>{booking.clientFirstName} {booking.clientLastName}
            </div>
            {booking.description && (
              <div className="border-t border-gray-100 pt-3">
                <BookingDescription description={booking.description} />
              </div>
            )}
            {booking.referenceImageUrl && (
              <a href={booking.referenceImageUrl} target="_blank" rel="noreferrer" className="mt-3 block">
                <img src={booking.referenceImageUrl} alt="Referencia del cliente" className="w-full h-32 object-cover rounded-lg" />
              </a>
            )}
          </div>
          <div className="bg-primary-50 rounded-xl p-5">
            <p className="text-xs text-primary-800 leading-relaxed">Si un material no esta disponible (ej. el cliente pidio un tipo de madera especifico), acláralo directo en el concepto de esa fila con tu sugerencia y su precio.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
