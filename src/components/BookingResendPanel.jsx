import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createBooking } from '../api/bookings'
import { searchProviders, getProviderDetail } from '../api/providers'
import { formatCurrency, formatResponseTime } from '../utils/format'
import { useNotify } from '../context/NotifyContext'

const PAYMENT_METHOD_LABELS = { EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', TRANSFERENCIA: 'Transferencia' }
const PRICE_TYPE_LABELS = { FIJO: 'precio fijo', POR_HORA: 'por hora', COTIZACION: 'a cotizar' }

const URGENCY_OPTIONS = [
  { value: 'URGENTE', label: 'Urgente', description: 'Lo necesito hoy', dot: 'bg-red-500' },
  { value: 'PRONTO', label: 'Pronto', description: 'En los proximos dias', dot: 'bg-yellow-400' },
  { value: 'PROGRAMADO', label: 'Programado', description: 'Puedo esperar', dot: 'bg-green-500' },
]

function toDatetimeLocalValue(isoString) {
  if (!isoString) return ''
  return isoString.slice(0, 16)
}

/** Se despliega debajo de una contratacion rechazada/expirada para reenviarla a otro
 * prestador de la misma categoria sin repetir el formulario completo. */
export default function BookingResendPanel({ booking, categoryName, onClose }) {
  const navigate = useNavigate()
  const { notify } = useNotify()

  const [candidates, setCandidates] = useState([])
  const [loadingCandidates, setLoadingCandidates] = useState(true)

  const [selectedProvider, setSelectedProvider] = useState(null)
  const [providerServices, setProviderServices] = useState([])
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [loadingServices, setLoadingServices] = useState(false)

  const [form, setForm] = useState({
    description: booking.description || '',
    addressLine: booking.addressLine,
    city: booking.city,
    scheduledAt: toDatetimeLocalValue(booking.scheduledAt),
    paymentMethod: booking.paymentMethod,
    urgency: booking.urgency,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoadingCandidates(true)
    searchProviders({ categoryId: booking.categoryId, sort: 'recomendados', size: 6 })
      .then((r) => {
        const list = r.data.data.content.filter((p) => p.id !== booking.providerId).slice(0, 5)
        setCandidates(list)
      })
      .finally(() => setLoadingCandidates(false))
  }, [booking.categoryId, booking.providerId])

  function selectProvider(provider) {
    setSelectedProvider(provider)
    setSelectedServiceId('')
    setProviderServices([])
    setError('')
    setLoadingServices(true)
    getProviderDetail(provider.id).then((r) => {
      const matches = r.data.data.services.filter((s) => s.categoryId === booking.categoryId)
      setProviderServices(matches)
      if (matches.length === 1) setSelectedServiceId(String(matches[0].id))
    }).finally(() => setLoadingServices(false))
  }

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  const selectedService = useMemo(
    () => providerServices.find((s) => String(s.id) === String(selectedServiceId)),
    [providerServices, selectedServiceId]
  )

  const selectedUrgency = URGENCY_OPTIONS.find((o) => o.value === form.urgency)

  function cancelResend() {
    setSelectedProvider(null)
    setProviderServices([])
    setSelectedServiceId('')
    setError('')
  }

  async function handleConfirm(e) {
    e.preventDefault()
    if (!selectedServiceId) {
      setError('Elige un servicio para continuar')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await createBooking({ serviceId: Number(selectedServiceId), ...form })
      notify('Solicitud reenviada al nuevo prestador', 'success')
      navigate(`/mis-contrataciones/${res.data.data.id}`)
    } catch (err) {
      const message = err.response?.data?.message || 'No se pudo reenviar la solicitud'
      setError(message)
      notify(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="border-t border-gray-100 pt-5 mt-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Prestadores similares{categoryName ? ` (${categoryName})` : ''}</h3>
        <button type="button" onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600">Cerrar</button>
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5 flex gap-2 items-start mb-4">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        <span className="text-xs text-gray-500 leading-relaxed">Se conserva tu direccion, fecha, urgencia y descripcion. Solo elige con quien.</span>
      </div>

      {loadingCandidates && <p className="text-sm text-gray-400">Buscando prestadores similares...</p>}
      {!loadingCandidates && candidates.length === 0 && (
        <p className="text-sm text-gray-500">No encontramos otros prestadores disponibles en esta categoria por ahora.</p>
      )}

      <div className="flex flex-col gap-3">
        {candidates.map((p) => {
          const isSelected = selectedProvider?.id === p.id
          return (
            <div key={p.id} className={`rounded-xl p-3 flex items-center gap-3 ${isSelected ? 'border-2 border-primary-600 bg-primary-50/40' : 'border border-gray-100'}`}>
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 shrink-0 overflow-hidden">
                {p.profileImageUrl ? (
                  <img src={p.profileImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4 4-6 8-6s8 2 8 6"></path></svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{p.businessName}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span className="text-amber-400">★</span> {p.averageRating ?? 0}
                  {formatResponseTime(p.averageResponseMinutes) && <> · Responde en {formatResponseTime(p.averageResponseMinutes)}</>}
                </div>
              </div>
              {isSelected ? (
                <span className="text-xs font-semibold text-primary-700 shrink-0">Seleccionado</span>
              ) : (
                <button onClick={() => selectProvider(p)} className="btn-secondary text-xs shrink-0">Elegir</button>
              )}
            </div>
          )
        })}
      </div>

      {selectedProvider && (
        <>
          <div className="mt-8 mb-6">
            <hr className="border-t-2 border-gray-200" />
          </div>

          <form onSubmit={handleConfirm} className="space-y-4">
            <div className="flex items-center gap-2 text-primary-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              <span className="text-sm font-bold text-gray-900">Reenviar solicitud</span>
            </div>

          {loadingServices && <p className="text-sm text-gray-400">Cargando servicios de {selectedProvider.businessName}...</p>}

          {!loadingServices && providerServices.length === 0 && (
            <p className="text-sm text-red-600">Este prestador ya no tiene servicios activos en esta categoria. Elige otro de la lista de arriba.</p>
          )}

          {providerServices.length > 1 && (
            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Servicio</span>
              <select required className="input" value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)}>
                <option value="">Selecciona un servicio</option>
                {providerServices.map((s) => (
                  <option key={s.id} value={s.id}>{s.title} — {formatCurrency(s.price)} ({PRICE_TYPE_LABELS[s.priceType]})</option>
                ))}
              </select>
            </label>
          )}

          {selectedService && (
            <div className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2.5 text-sm">
              <span className="text-gray-700 font-medium">{selectedService.title}</span>
              <span className="font-bold text-gray-900">{formatCurrency(selectedService.price)} <span className="text-xs font-normal text-gray-500">({PRICE_TYPE_LABELS[selectedService.priceType]})</span></span>
            </div>
          )}

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}

          <p className="text-xs text-gray-400 font-semibold tracking-wide">SE MANTIENEN ESTOS DATOS</p>

          <label className="block text-sm">
            <span className="block text-gray-700 mb-1 font-medium">Describe lo que necesitas</span>
            <textarea className="input" rows={3} value={form.description} onChange={set('description')} />
          </label>
          <label className="block text-sm">
            <span className="block text-gray-700 mb-1 font-medium">Direccion de la visita</span>
            <input required className="input" value={form.addressLine} onChange={set('addressLine')} />
          </label>
          <label className="block text-sm">
            <span className="block text-gray-700 mb-1 font-medium">Ciudad</span>
            <input required className="input" value={form.city} onChange={set('city')} />
          </label>
          <label className="block text-sm">
            <span className="block text-gray-700 mb-1 font-medium">Fecha y hora de la visita</span>
            <input required type="datetime-local" className="input" value={form.scheduledAt} onChange={set('scheduledAt')} />
            <span className="text-xs text-gray-500 mt-1 block">Prellenada con la fecha original; ajustala si ya no te sirve.</span>
          </label>
          <label className="block text-sm">
            <span className="block text-gray-700 mb-1 font-medium">Que tan pronto lo necesitas</span>
            <div className="relative">
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full pointer-events-none ${selectedUrgency.dot}`} />
              <select className="input pl-8" value={form.urgency} onChange={set('urgency')}>
                {URGENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label} — {opt.description}</option>
                ))}
              </select>
            </div>
          </label>
          <label className="block text-sm">
            <span className="block text-gray-700 mb-1 font-medium">Metodo de pago</span>
            <select className="input" value={form.paymentMethod} onChange={set('paymentMethod')}>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2.5">
            <span className="text-xs text-gray-500 leading-relaxed">No vuelves a llenar el formulario: solo se actualiza el precio/servicio segun el nuevo prestador.</span>
          </div>

          <button type="submit" disabled={submitting || !selectedServiceId} className="btn-primary w-full">
            {submitting ? 'Enviando...' : 'Confirmar y reenviar'}
          </button>
          <button type="button" onClick={cancelResend} className="btn-secondary w-full">
            Cancelar
          </button>
          </form>
        </>
      )}
    </div>
  )
}
