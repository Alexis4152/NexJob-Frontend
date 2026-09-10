import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getPublicService, getProviderBusySlots } from '../api/providers'
import { createBooking } from '../api/bookings'
import { formatCurrency } from '../utils/format'
import { useNotify } from '../context/NotifyContext'

const PRICE_TYPE_LABELS = { FIJO: 'precio fijo', POR_HORA: 'por hora', COTIZACION: 'a cotizar' }
const PAYMENT_METHOD_LABELS = { EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', TRANSFERENCIA: 'Transferencia' }

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
  const [form, setForm] = useState({ description: '', addressLine: '', city: '', scheduledAt: '', paymentMethod: 'EFECTIVO' })
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

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (isSlotTaken) {
      setError('El prestador ya tiene una visita agendada en esa fecha y hora. Elige otro horario.')
      return
    }
    setSubmitting(true)
    try {
      const res = await createBooking({ serviceId: Number(serviceId), ...form })
      notify('Solicitud enviada al prestador', 'success')
      navigate(`/mis-contrataciones/${res.data.data.id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo enviar la solicitud')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="container-app py-12 text-gray-500">Cargando...</div>
  if (!service) return <div className="container-app py-12 text-gray-500">Servicio no encontrado.</div>

  return (
    <div className="container-app py-8 max-w-lg mx-auto">
      <Link to={`/prestadores/${service.providerId}`} className="text-sm text-primary-700 hover:underline">← Volver al perfil</Link>

      <div className="card p-6 mt-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Contratar servicio</h1>
        <p className="text-gray-600 mb-1">{service.title} — {service.providerBusinessName}</p>
        <p className="font-semibold text-gray-900 mb-6">
          {formatCurrency(service.price)} <span className="text-xs font-normal text-gray-500">({PRICE_TYPE_LABELS[service.priceType]})</span>
        </p>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <input required type="datetime-local" className={`input ${isSlotTaken ? 'border-red-400' : ''}`} value={form.scheduledAt} onChange={set('scheduledAt')} />
            {isSlotTaken && (
              <span className="text-xs text-red-600 mt-1 block">Este horario ya esta apartado con el prestador. Elige otro.</span>
            )}
            {busySlots.length > 0 && (
              <details className="text-xs text-gray-500 mt-1">
                <summary className="cursor-pointer hover:text-gray-700">Ver horarios ya ocupados con este prestador</summary>
                <ul className="mt-1 space-y-0.5 list-disc list-inside">
                  {busySlots.slice(0, 15).map((s) => (
                    <li key={s}>{new Date(s).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</li>
                  ))}
                </ul>
              </details>
            )}
          </label>
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
    </div>
  )
}
