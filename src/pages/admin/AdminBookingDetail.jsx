import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { adminGetBookingDetail } from '../../api/bookings'
import StatusBadge from '../../components/StatusBadge'
import { formatCurrency, formatDate } from '../../utils/format'

export default function AdminBookingDetail() {
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminGetBookingDetail(id).then((r) => setBooking(r.data.data)).finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-gray-500">Cargando...</p>
  if (!booking) return <p className="text-gray-500">Contratacion no encontrada.</p>

  return (
    <div className="max-w-2xl">
      <Link to="/admin/contrataciones" className="text-sm text-primary-700 hover:underline">← Contrataciones</Link>

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
            <h3 className="font-semibold text-gray-900 mb-1">Cliente</h3>
            <p className="text-gray-600">{booking.clientFirstName} {booking.clientLastName}</p>
            {booking.clientPhone && <p className="text-gray-600">{booking.clientPhone}</p>}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Prestador</h3>
            <p className="text-gray-600">{booking.providerBusinessName}</p>
            {booking.providerPhone && <p className="text-gray-600">{booking.providerPhone}</p>}
          </div>
        </div>

        <div className="text-sm mb-6">
          <h3 className="font-semibold text-gray-900 mb-1">Visita</h3>
          <p className="text-gray-600">{formatDate(booking.scheduledAt)}</p>
          <p className="text-gray-600">{booking.addressLine}, {booking.city}</p>
        </div>

        <div className="flex justify-between items-center border-t border-gray-100 pt-4 mb-6">
          <span className="text-sm text-gray-500">Metodo de pago: {booking.paymentMethod === 'EFECTIVO' ? 'Efectivo' : 'Tarjeta'}</span>
          <span className="text-lg font-bold text-gray-900">{formatCurrency(booking.agreedPrice)}</span>
        </div>

        {booking.payment && (
          <div className="text-sm mb-6">
            <h3 className="font-semibold text-gray-900 mb-1">Pago</h3>
            <p className="text-gray-600">Estado: {booking.payment.status} {booking.payment.releasedAt ? `· liberado ${formatDate(booking.payment.releasedAt)}` : ''}</p>
          </div>
        )}

        {booking.evidences?.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Evidencias</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {booking.evidences.map((ev) => (
                <a key={ev.id} href={ev.url} target="_blank" rel="noreferrer">
                  <img src={ev.url} alt="" className="w-full h-24 object-cover rounded-lg" />
                </a>
              ))}
            </div>
          </div>
        )}

        {booking.history?.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
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
