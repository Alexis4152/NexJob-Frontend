import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getPublicService, getProviderBusySlots } from '../api/providers'
import { createBooking } from '../api/bookings'
import { formatCurrency } from '../utils/format'
import { useNotify } from '../context/NotifyContext'
import { SERVICE_DAYS_LABELS, SERVICE_HOURS_LABELS } from '../utils/providerSchedule'

const PRICE_TYPE_LABELS = { FIJO: 'precio fijo', POR_HORA: 'por hora', COTIZACION: 'a cotizar' }
const PAYMENT_METHOD_LABELS = { EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', TRANSFERENCIA: 'Transferencia' }

const URGENCY_OPTIONS = [
  { value: 'URGENTE', label: 'Urgente', description: 'Lo necesito hoy', dot: 'bg-red-500' },
  { value: 'PRONTO', label: 'Pronto', description: 'En los proximos dias', dot: 'bg-yellow-400' },
  { value: 'PROGRAMADO', label: 'Programado', description: 'Puedo esperar', dot: 'bg-green-500' },
]

function pad(n) {
  return String(n).padStart(2, '0')
}

function toLocalIso(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export default function BookingNew() {
  const { serviceId } = useParams()
  const navigate = useNavigate()
  const { notify } = useNotify()
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ description: '', addressLine: '', city: '', scheduledAt: '', paymentMethod: 'EFECTIVO', urgency: 'PROGRAMADO' })
  const [error, setError] = useState('')
  const [busySlots, setBusySlots] = useState([])

  useEffect(() => {
    getPublicService(serviceId).then((r) => setService(r.data.data)).finally(() => setLoading(false))
  }, [serviceId])

  useEffect(() => {
    if (!service?.providerId) return
    const now = new Date()
    const in60Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 60, 23, 59, 59)
    getProviderBusySlots(service.providerId, { from: toLocalIso(now), to: toLocalIso(in60Days) })
      .then((r) => setBusySlots(r.data.data))
  }, [service?.providerId])

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  const isSlotTaken = form.scheduledAt !== '' && busySlots.some((s) => s.slice(0, 16) === form.scheduledAt)
  const selectedUrgency = URGENCY_OPTIONS.find((o) => o.value === form.urgency)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (isSlotTaken) {
      const message = 'El prestador ya tiene una visita agendada en esa fecha y hora. Elige otro horario.'
      setError(message)
      notify(message, 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await createBooking({ serviceId: Number(serviceId), ...form })
      notify('Solicitud enviada al prestador', 'success')
      navigate(`/mis-contrataciones/${res.data.data.id}`)
    } catch (err) {
      const message = err.response?.data?.message || 'No se pudo enviar la solicitud'
      setError(message)
      notify(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="container-app py-12 text-gray-500">Cargando...</div>
  if (!service) return <div className="container-app py-12 text-gray-500">Servicio no encontrado.</div>

  return (
    <div className="container-app py-8">
      <Link to={`/prestadores/${service.providerId}`} className="text-sm text-primary-700 hover:underline">← Volver al perfil</Link>

      <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-6">Contratar servicio</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="card p-6 sm:p-8">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Describe lo que necesitas</span>
              <textarea className="input" rows={3} placeholder="Ej. Necesito que revisen una fuga de agua en la cocina" value={form.description} onChange={set('description')} />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">Direccion de la visita</span>
                <input required className="input" placeholder="Ej. Av. Insurgentes Sur 1234, Col. Del Valle" value={form.addressLine} onChange={set('addressLine')} />
              </label>
              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">Ciudad</span>
                <input required className="input" placeholder="Ej. Ciudad de Mexico" value={form.city} onChange={set('city')} />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">Fecha y hora de la visita</span>
                <input required type="datetime-local" lang="es-MX" className={`input ${isSlotTaken ? 'border-red-400' : ''}`} value={form.scheduledAt} onChange={set('scheduledAt')} />
                {isSlotTaken && (
                  <span className="text-xs text-red-600 mt-1 block">Este horario ya esta apartado con el prestador. Elige otro.</span>
                )}
              </label>

              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">¿Que tan pronto lo necesitas?</span>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full pointer-events-none ${selectedUrgency.dot}`} />
                  <select className="input pl-8" value={form.urgency} onChange={set('urgency')}>
                    {URGENCY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label} — {opt.description}</option>
                    ))}
                  </select>
                </div>
              </label>
            </div>

            <div>
              <span className="block text-gray-700 mb-2 text-sm font-medium">Metodo de pago</span>
              <div className="flex gap-3">
                {['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'].map((m) => (
                  <label key={m} className={`flex-1 border rounded-lg px-3 py-2 text-sm text-center cursor-pointer ${form.paymentMethod === m ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-600'}`}>
                    <input type="radio" name="paymentMethod" value={m} checked={form.paymentMethod === m} onChange={set('paymentMethod')} className="hidden" />
                    {PAYMENT_METHOD_LABELS[m]}
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {form.paymentMethod === 'TRANSFERENCIA'
                  ? 'Al validar el servicio deberas adjuntar una foto del comprobante de transferencia.'
                  : 'El pago se libera hasta que valides que el servicio quedo bien.'}
              </p>
            </div>

            <button type="submit" disabled={submitting || isSlotTaken} className="btn-primary w-full">
              {submitting ? 'Enviando...' : 'Solicitar contratacion'}
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-20">
          <div className="card p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Servicio</h2>
            <p className="font-semibold text-gray-900 mb-0.5">{service.title}</p>
            <p className="text-sm text-gray-500 mb-3">{service.providerBusinessName}</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(service.price)} <span className="text-xs font-normal text-gray-500">({PRICE_TYPE_LABELS[service.priceType]})</span>
            </p>
            {(service.providerServiceDays || service.providerServiceHours) && (
              <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                {service.providerServiceDays && (
                  <span className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    {SERVICE_DAYS_LABELS[service.providerServiceDays]}
                  </span>
                )}
                {service.providerServiceHours && (
                  <span className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    {SERVICE_HOURS_LABELS[service.providerServiceHours]}
                  </span>
                )}
              </div>
            )}
          </div>

          {busySlots.length > 0 && (
            <details className="card p-4 text-xs text-gray-500">
              <summary className="cursor-pointer hover:text-gray-700 font-medium text-gray-700">Horarios ya ocupados con este prestador</summary>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                {busySlots.slice(0, 15).map((s) => (
                  <li key={s}>{new Date(s).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</li>
                ))}
              </ul>
            </details>
          )}

          <div className="bg-primary-50 rounded-xl p-5">
            <p className="text-xs text-primary-800 leading-relaxed">Pago protegido: se libera hasta que apruebes que el trabajo quedo bien.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
