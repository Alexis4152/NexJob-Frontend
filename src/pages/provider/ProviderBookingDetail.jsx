import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getProviderBookingDetail, updateBookingStatus, uploadBookingEvidence } from '../../api/bookings'
import { useNotify } from '../../context/NotifyContext'
import StatusBadge from '../../components/StatusBadge'
import { formatCurrency, formatDate } from '../../utils/format'

const PAYMENT_METHOD_LABELS = { EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', TRANSFERENCIA: 'Transferencia' }

export default function ProviderBookingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notify, confirmDialog } = useNotify()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState(null)
  const [description, setDescription] = useState('')
  const [working, setWorking] = useState(false)

  function load() {
    setLoading(true)
    getProviderBookingDetail(id).then((r) => setBooking(r.data.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  async function handleUploadEvidence(e) {
    e.preventDefault()
    if (!file) return
    setWorking(true)
    try {
      await uploadBookingEvidence(id, file, description)
      notify('Evidencia subida', 'success')
      setFile(null)
      setDescription('')
      load()
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo subir la evidencia', 'error')
    } finally {
      setWorking(false)
    }
  }

  async function handleConclude() {
    const message = booking.paymentMethod === 'EFECTIVO'
      ? 'Una vez movido a concluido se da por entendido que se ha realizado el pago por sus servicios. ¿Esta usted de acuerdo?'
      : '¿Marcar este servicio como concluido? El cliente debera validarlo para liberar el pago.'
    const ok = await confirmDialog(message, { title: 'Marcar como concluido', danger: false, confirmText: 'Marcar concluido' })
    if (!ok) return
    setWorking(true)
    try {
      await updateBookingStatus(id, 'CONCLUIDO')
      notify('Servicio marcado como concluido', 'success')
      load()
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo marcar como concluido', 'error')
    } finally {
      setWorking(false)
    }
  }

  if (loading) return <p className="text-gray-500">Cargando...</p>
  if (!booking) return <p className="text-gray-500">Contratacion no encontrada.</p>

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate('/prestador')} className="text-sm text-primary-700 hover:underline">← Tablero de trabajos</button>

      <div className="card p-6 mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{booking.serviceTitle}</h1>
            <p className="text-xs text-gray-500">Folio {booking.folio}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Cliente</h3>
            <p className="text-gray-600">{booking.clientFirstName} {booking.clientLastName}</p>
            {booking.clientPhone && <p className="text-gray-600">{booking.clientPhone}</p>}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Visita</h3>
            <p className="text-gray-600">{formatDate(booking.scheduledAt)}</p>
            <p className="text-gray-600">{booking.addressLine}, {booking.city}</p>
          </div>
        </div>

        {booking.description && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">El cliente solicito</h3>
            <p className="text-sm text-gray-600">{booking.description}</p>
          </div>
        )}

        <div className="flex justify-between items-center border-t border-gray-100 pt-4 mb-6">
          <span className="text-sm text-gray-500">Metodo de pago: {PAYMENT_METHOD_LABELS[booking.paymentMethod]}</span>
          <span className="text-lg font-bold text-gray-900">{formatCurrency(booking.agreedPrice)}</span>
        </div>

        {booking.evidences?.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Evidencias subidas</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {booking.evidences.map((ev) => (
                <a key={ev.id} href={ev.url} target="_blank" rel="noreferrer">
                  <img src={ev.url} alt={ev.description || ''} className="w-full h-24 object-cover rounded-lg" />
                </a>
              ))}
            </div>
          </div>
        )}

        {booking.payment?.proofUrl && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Comprobante de transferencia</h3>
            <a href={booking.payment.proofUrl} target="_blank" rel="noreferrer">
              <img src={booking.payment.proofUrl} alt="Comprobante de transferencia" className="w-32 h-32 object-cover rounded-lg" />
            </a>
          </div>
        )}

        {booking.status === 'EN_PROCESO' && (
          <div className="border-t border-gray-100 pt-5 space-y-4">
            <form onSubmit={handleUploadEvidence} className="space-y-3">
              <h3 className="font-semibold text-gray-900">Subir evidencia del trabajo realizado</h3>
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
              <input className="input" placeholder="Descripcion (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} />
              <button type="submit" disabled={!file || working} className="btn-secondary w-full">
                {working ? 'Subiendo...' : 'Subir evidencia'}
              </button>
            </form>

            <button
              onClick={handleConclude}
              disabled={working || !booking.evidences?.length}
              className="btn-primary w-full"
              title={!booking.evidences?.length ? 'Sube al menos una evidencia primero' : ''}
            >
              Marcar servicio como concluido
            </button>
          </div>
        )}

        {booking.history?.length > 0 && (
          <div className="border-t border-gray-100 pt-5 mt-5">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Historial</h3>
            <ul className="space-y-1 text-xs text-gray-500">
              {booking.history.map((h, i) => (
                <li key={i}>{formatDate(h.changedAt)} — {h.previousStatus ? `${h.previousStatus} → ` : ''}{h.newStatus}{h.note ? `: ${h.note}` : ''}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
