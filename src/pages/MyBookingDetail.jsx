import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getMyBookingDetail, cancelBooking, approveBooking, reviewBooking } from '../api/bookings'
import { useNotify } from '../context/NotifyContext'
import StatusBadge from '../components/StatusBadge'
import RatingStars from '../components/RatingStars'
import { formatCurrency, formatDate } from '../utils/format'

const CANCELABLE = ['SOLICITADO', 'ACEPTADO']
const PAYMENT_METHOD_LABELS = { EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', TRANSFERENCIA: 'Transferencia' }

export default function MyBookingDetail() {
  const { id } = useParams()
  const { notify, confirmDialog } = useNotify()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cardNumber, setCardNumber] = useState('')
  const [proofFile, setProofFile] = useState(null)
  const [working, setWorking] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  function load() {
    setLoading(true)
    getMyBookingDetail(id).then((r) => setBooking(r.data.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  async function handleCancel() {
    const ok = await confirmDialog('¿Seguro que quieres cancelar esta contratacion?', { title: 'Cancelar contratacion' })
    if (!ok) return
    setWorking(true)
    try {
      await cancelBooking(id, 'Cancelado por el cliente')
      notify('Contratacion cancelada', 'success')
      load()
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo cancelar', 'error')
    } finally {
      setWorking(false)
    }
  }

  async function handleApprove(e) {
    e.preventDefault()
    setWorking(true)
    try {
      await approveBooking(id, {
        cardNumber: booking.paymentMethod === 'TARJETA' ? cardNumber : undefined,
        file: booking.paymentMethod === 'TRANSFERENCIA' ? proofFile : undefined,
      })
      notify('Servicio validado y pago liberado', 'success')
      load()
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo procesar el pago', 'error')
    } finally {
      setWorking(false)
    }
  }

  async function handleReview(e) {
    e.preventDefault()
    setWorking(true)
    try {
      await reviewBooking(id, { rating, comment })
      notify('Gracias por tu resena', 'success')
      load()
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo enviar tu resena', 'error')
    } finally {
      setWorking(false)
    }
  }

  if (loading) return <div className="container-app py-12 text-gray-500">Cargando...</div>
  if (!booking) return <div className="container-app py-12 text-gray-500">Contratacion no encontrada.</div>

  return (
    <div className="container-app py-8 max-w-2xl mx-auto">
      <Link to="/mis-contrataciones" className="text-sm text-primary-700 hover:underline">← Mis contrataciones</Link>

      <div className="card p-6 mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{booking.serviceTitle}</h1>
            <p className="text-xs text-gray-500">Folio {booking.folio} · {formatDate(booking.createdAt)}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Prestador</h3>
            <p className="text-gray-600">{booking.providerBusinessName}</p>
            {booking.providerPhone && <p className="text-gray-600">{booking.providerPhone}</p>}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Visita</h3>
            <p className="text-gray-600">{formatDate(booking.scheduledAt)}</p>
            <p className="text-gray-600">{booking.addressLine}, {booking.city}</p>
          </div>
        </div>

        {booking.description && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">Descripcion</h3>
            <p className="text-sm text-gray-600">{booking.description}</p>
          </div>
        )}

        <div className="flex justify-between items-center border-t border-gray-100 pt-4 mb-6">
          <span className="text-sm text-gray-500">Metodo de pago: {PAYMENT_METHOD_LABELS[booking.paymentMethod]}</span>
          <span className="text-lg font-bold text-gray-900">{formatCurrency(booking.agreedPrice)}</span>
        </div>

        {booking.evidences?.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Evidencias del prestador</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {booking.evidences.map((ev) => (
                <a key={ev.id} href={ev.url} target="_blank" rel="noreferrer">
                  <img src={ev.url} alt={ev.description || ''} className="w-full h-24 object-cover rounded-lg" />
                </a>
              ))}
            </div>
          </div>
        )}

        {CANCELABLE.includes(booking.status) && (
          <button onClick={handleCancel} disabled={working} className="btn-secondary text-sm w-full mb-2">
            Cancelar contratacion
          </button>
        )}

        {booking.status === 'CONCLUIDO' && (
          <form onSubmit={handleApprove} className="border-t border-gray-100 pt-5">
            <h3 className="font-semibold text-gray-900 mb-2">Validar servicio y liberar pago</h3>
            <p className="text-sm text-gray-600 mb-3">Revisa las evidencias y confirma que el servicio se realizo correctamente para liberar el pago al prestador.</p>
            {booking.paymentMethod === 'TARJETA' && (
              <input
                required
                className="input mb-3"
                placeholder="Numero de tarjeta"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
              />
            )}
            {booking.paymentMethod === 'TRANSFERENCIA' && (
              <label className="block text-sm mb-3">
                <span className="block text-gray-700 mb-1 font-medium">Foto del comprobante de transferencia</span>
                <input
                  required
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                  className="text-sm"
                />
              </label>
            )}
            <button type="submit" disabled={working} className="btn-primary w-full">
              {working ? 'Procesando...' : 'Confirmar y liberar pago'}
            </button>
          </form>
        )}

        {booking.status === 'APROBADO' && !booking.review && (
          <form onSubmit={handleReview} className="border-t border-gray-100 pt-5">
            <h3 className="font-semibold text-gray-900 mb-2">Califica al prestador</h3>
            <RatingStars value={rating} onChange={setRating} size="text-2xl" />
            <textarea className="input mt-3" rows={3} placeholder="Cuentanos tu experiencia (opcional)" value={comment} onChange={(e) => setComment(e.target.value)} />
            <button type="submit" disabled={working} className="btn-primary w-full mt-3">
              {working ? 'Enviando...' : 'Enviar resena'}
            </button>
          </form>
        )}

        {booking.payment?.proofUrl && (
          <div className="border-t border-gray-100 pt-5 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Comprobante de transferencia</h3>
            <a href={booking.payment.proofUrl} target="_blank" rel="noreferrer">
              <img src={booking.payment.proofUrl} alt="Comprobante de transferencia" className="w-32 h-32 object-cover rounded-lg" />
            </a>
          </div>
        )}

        {booking.review && (
          <div className="border-t border-gray-100 pt-5">
            <h3 className="font-semibold text-gray-900 mb-2">Tu resena</h3>
            <RatingStars value={booking.review.rating} />
            {booking.review.comment && <p className="text-sm text-gray-600 mt-1">{booking.review.comment}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
