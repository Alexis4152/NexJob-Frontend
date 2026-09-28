import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getMyBookingDetail, cancelBooking, approveBooking, reviewBooking, acceptBookingQuote, rejectBookingQuote } from '../api/bookings'
import { useNotify } from '../context/NotifyContext'
import StatusBadge from '../components/StatusBadge'
import RatingStars from '../components/RatingStars'
import BookingResendPanel from '../components/BookingResendPanel'
import BookingDescription from '../components/BookingDescription'
import QuoteTicket from '../components/QuoteTicket'
import { formatCurrency, formatDate, formatDateOrTBD, formatLocalDateEs } from '../utils/format'

const PAYMENT_METHOD_LABELS = { EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', TRANSFERENCIA: 'Transferencia' }
const HIDE_SHARED_DETAILS_FOR = ['SOLICITADO', 'COTIZADO', 'COTIZACION_ACEPTADA', 'ACEPTADO', 'EN_PROCESO', 'CONCLUIDO', 'APROBADO', 'RECHAZADO']

const TIMELINE_STEPS = [
  {
    status: 'SOLICITADO', label: 'Solicitado', hint: 'Cliente envia',
    icon: <><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></>,
  },
  {
    status: 'COTIZADO', label: 'Cotizado', hint: 'Prestador cotiza', onlyForCotizacion: true,
    icon: <><path d="M9 7h6M9 11h6M9 15h3"></path><path d="M5 4h14v16l-3-2-3 2-3-2-3 2-2-2z"></path></>,
  },
  {
    status: 'COTIZACION_ACEPTADA', label: 'Cotizacion aceptada', hint: 'Cliente confirma precio', onlyForCotizacion: true,
    icon: <path d="M20 6L9 17l-5-5"></path>,
  },
  {
    status: 'ACEPTADO', label: 'Aceptado', hint: 'Prestador confirma',
    icon: <path d="M20 6L9 17l-5-5"></path>,
  },
  {
    status: 'EN_PROCESO', label: 'En proceso', hint: 'Se realiza el servicio',
    icon: <><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></>,
  },
  {
    status: 'CONCLUIDO', label: 'Concluido', hint: 'Prestador sube evidencia',
    icon: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></>,
  },
  {
    status: 'APROBADO', label: 'Aprobado', hint: 'Cliente aprueba y califica',
    icon: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"></path>,
  },
]

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
  const [showResend, setShowResend] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [dateConfirmed, setDateConfirmed] = useState(false)
  const [deliveryMethod, setDeliveryMethod] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryCity, setDeliveryCity] = useState('')

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

  async function handleAcceptQuote() {
    const ok = await confirmDialog(`¿Aceptar la cotizacion por ${formatCurrency(booking.quoteTotal)}? La contratacion se confirmara con este precio.`, { title: 'Aceptar cotizacion' })
    if (!ok) return
    setWorking(true)
    try {
      await acceptBookingQuote(id, {
        deliveryMethod,
        addressLine: deliveryMethod === 'DOMICILIO' ? deliveryAddress : undefined,
        city: deliveryMethod === 'DOMICILIO' ? deliveryCity : undefined,
      })
      notify('Cotizacion aceptada', 'success')
      load()
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo aceptar la cotizacion', 'error')
    } finally {
      setWorking(false)
    }
  }

  async function handleRejectQuote() {
    const ok = await confirmDialog('¿Rechazar esta cotizacion? La contratacion se cancelara y podras buscar otro prestador.', { title: 'Rechazar cotizacion', danger: true })
    if (!ok) return
    setWorking(true)
    try {
      await rejectBookingQuote(id, rejectReason || undefined)
      notify('Cotizacion rechazada', 'success')
      load()
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo rechazar la cotizacion', 'error')
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

  const timelineSteps = TIMELINE_STEPS.filter((s) => !s.onlyForCotizacion || booking.priceType === 'COTIZACION')
  const timelineIndex = timelineSteps.findIndex((s) => s.status === booking.status)

  // Antes de aceptar la cotizacion, el cliente debe confirmar que la fecha estimada le sirve
  // (si el prestador dio una) y decir donde se entrega el trabajo -- este es el momento en que
  // por fin se sabe la direccion real, ya que no se pidio al solicitar un servicio "a cotizar".
  const needsDateConfirmation = !!booking.estimatedDeliveryDate
  const canAcceptQuote = (!needsDateConfirmation || dateConfirmed)
    && (deliveryMethod === 'RECOGER_SITIO' || (deliveryMethod === 'DOMICILIO' && deliveryAddress.trim() && deliveryCity.trim()))

  return (
    <div className="container-app py-8">
      <div className="max-w-2xl mx-auto">
        <Link to="/mis-contrataciones" className="text-sm text-primary-700 hover:underline">← Mis contrataciones</Link>
      </div>

      {timelineIndex >= 0 && (
        <div className="w-full sm:w-[80%] mx-auto mt-4">
          <div className="card p-6">
            <div className="relative flex items-start justify-between">
              <div className="absolute top-4 left-[10%] right-[10%] h-0.5 bg-gray-100" />
              {timelineSteps.map((step, i) => {
                const done = i <= timelineIndex
                return (
                  <div key={step.status} className="relative flex-1 flex flex-col items-center text-center px-0.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${done ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-300 border-2 border-primary-100'}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{step.icon}</svg>
                    </div>
                    <span className={`text-[10px] sm:text-xs font-semibold ${done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</span>
                    <span className="hidden sm:block text-[10px] text-gray-400">{step.hint}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
      <div className="card p-6 mt-4">
        {booking.status === 'SOLICITADO' ? (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-green-600 mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 12l3 3 5-6"></path></svg>
              <span className="text-base font-bold text-gray-900">Solicitud enviada</span>
            </div>

            <div className="flex flex-col gap-2.5 text-sm mb-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Prestador</span>
                <span className="font-medium text-gray-900 text-right">{booking.providerBusinessName}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Servicio</span>
                <span className="font-medium text-gray-900 text-right">{booking.serviceTitle}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Fecha</span>
                <span className="font-medium text-gray-900 text-right">{formatDateOrTBD(booking.scheduledAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Estado</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Esperando respuesta
                </span>
              </div>
            </div>

            <details className="group border border-gray-200 rounded-lg mb-5 [&::-webkit-details-marker]:hidden">
              <summary className="cursor-pointer list-none flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700">
                Ver detalles de la visita
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 transition-transform group-open:rotate-180"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </summary>
              <div className="px-3 pb-3 pt-1 border-t border-gray-100 flex flex-col gap-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Folio</span>
                  <span className="font-medium text-gray-900 text-right">{booking.folio}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Metodo de pago</span>
                  <span className="font-medium text-gray-900 text-right">{PAYMENT_METHOD_LABELS[booking.paymentMethod]} {formatCurrency(booking.agreedPrice)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Fecha de registro</span>
                  <span className="font-medium text-gray-900 text-right">{formatDate(booking.createdAt)}</span>
                </div>
                {booking.description && (
                  <div>
                    <span className="text-gray-500 block mb-0.5">Descripcion</span>
                    <BookingDescription description={booking.description} textClassName="text-gray-900" />
                  </div>
                )}
              </div>
            </details>

            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2.5 flex gap-2 items-start mb-5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span className="text-xs text-gray-500 leading-relaxed">
                Si el prestador de servicio no responde en un lapso de 48 hrs esta solicitud se cancela en automatico. Puede elegir otro.
              </span>
            </div>

            <button onClick={handleCancel} disabled={working} className="btn-danger text-sm w-full">
              Cancelar solicitud
            </button>
          </div>
        ) : booking.status === 'COTIZADO' ? (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-blue-600 mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 7h6M9 11h6M9 15h3"></path><path d="M5 4h14v16l-3-2-3 2-3-2-3 2-2-2z"></path></svg>
              <span className="text-base font-bold text-gray-900">{booking.providerBusinessName} te envio una cotizacion</span>
            </div>

            <div className="flex flex-col gap-2.5 text-sm mb-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Prestador</span>
                <span className="font-medium text-gray-900 text-right">{booking.providerBusinessName}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Servicio</span>
                <span className="font-medium text-gray-900 text-right">{booking.serviceTitle}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Fecha</span>
                <span className="font-medium text-gray-900 text-right">{formatDateOrTBD(booking.scheduledAt)}</span>
              </div>
            </div>

            {booking.description && (
              <div className="mb-5">
                <span className="text-gray-500 block mb-0.5 text-sm">Tu solicitud original</span>
                <BookingDescription description={booking.description} />
              </div>
            )}

            <QuoteTicket booking={booking} />

            <div className="border border-gray-200 rounded-lg p-4 mb-5">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Antes de aceptar</h3>

              {needsDateConfirmation && (
                <label className="flex items-start gap-2 text-sm mb-4">
                  <input type="checkbox" className="w-4 h-4 mt-0.5" checked={dateConfirmed} onChange={(e) => setDateConfirmed(e.target.checked)} />
                  <span className="text-gray-700">
                    Confirmo que la fecha de entrega estimada (<span className="font-semibold">{formatLocalDateEs(booking.estimatedDeliveryDate)}</span>) me funciona.
                  </span>
                </label>
              )}

              <span className="block text-gray-700 mb-2 text-sm font-medium">¿Donde se entrega el producto?</span>
              <div className="flex flex-col gap-2 mb-3">
                <label className={`flex items-center gap-2 text-sm border rounded-lg px-3 py-2 cursor-pointer ${deliveryMethod === 'DOMICILIO' ? 'border-primary-600 bg-primary-50' : 'border-gray-300'}`}>
                  <input type="radio" name="deliveryMethod" checked={deliveryMethod === 'DOMICILIO'} onChange={() => setDeliveryMethod('DOMICILIO')} />
                  Entregar en mi domicilio
                </label>
                <label className={`flex items-center gap-2 text-sm border rounded-lg px-3 py-2 cursor-pointer ${deliveryMethod === 'RECOGER_SITIO' ? 'border-primary-600 bg-primary-50' : 'border-gray-300'}`}>
                  <input type="radio" name="deliveryMethod" checked={deliveryMethod === 'RECOGER_SITIO'} onChange={() => setDeliveryMethod('RECOGER_SITIO')} />
                  Recoger en el sitio del prestador
                </label>
              </div>

              {deliveryMethod === 'DOMICILIO' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block text-sm">
                    <span className="block text-gray-700 mb-1 font-medium">Direccion</span>
                    <input required className="input" placeholder="Ej. Av. Insurgentes Sur 1234, Col. Del Valle" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
                  </label>
                  <label className="block text-sm">
                    <span className="block text-gray-700 mb-1 font-medium">Ciudad</span>
                    <input required className="input" placeholder="Ej. Ciudad de Mexico" value={deliveryCity} onChange={(e) => setDeliveryCity(e.target.value)} />
                  </label>
                </div>
              )}
            </div>

            <label className="block text-sm mb-3">
              <span className="block text-gray-700 mb-1 font-medium">Motivo si vas a rechazar <span className="text-gray-400 font-normal">(opcional)</span></span>
              <input className="input" placeholder="Ej. No se ajusta a mi presupuesto" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            </label>

            <div className="flex flex-col sm:flex-row gap-3">
              <button type="button" onClick={handleRejectQuote} disabled={working} className="btn-secondary text-sm flex-1">Rechazar</button>
              <button type="button" onClick={handleAcceptQuote} disabled={working || !canAcceptQuote} className="btn-primary text-sm flex-1">Aceptar cotizacion</button>
            </div>
          </div>
        ) : booking.status === 'COTIZACION_ACEPTADA' ? (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-teal-600 mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 12l3 3 5-6"></path></svg>
              <span className="text-base font-bold text-gray-900">Aceptaste la cotizacion</span>
            </div>

            <div className="flex flex-col gap-2.5 text-sm mb-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Prestador</span>
                <span className="font-medium text-gray-900 text-right">{booking.providerBusinessName}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Servicio</span>
                <span className="font-medium text-gray-900 text-right">{booking.serviceTitle}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Precio acordado</span>
                <span className="font-medium text-gray-900 text-right">{formatCurrency(booking.agreedPrice)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Fecha</span>
                <span className="font-medium text-gray-900 text-right">{formatDateOrTBD(booking.scheduledAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Entrega</span>
                <span className="font-medium text-gray-900 text-right">{booking.addressLine ? `${booking.addressLine}, ${booking.city}` : 'Por definir'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Estado</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-teal-100 text-teal-800 px-2.5 py-1 rounded-full">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Esperando confirmacion del prestador
                </span>
              </div>
            </div>

            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2.5 flex gap-2 items-start mb-5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span className="text-xs text-gray-500 leading-relaxed">
                El precio ya quedo acordado. El prestador debe confirmar para agendar la visita.
              </span>
            </div>

            <button onClick={handleCancel} disabled={working} className="btn-danger text-sm w-full">
              Cancelar contratacion
            </button>
          </div>
        ) : booking.status === 'ACEPTADO' ? (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-green-600 mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 12l3 3 5-6"></path></svg>
              <span className="text-base font-bold text-gray-900">¡{booking.providerBusinessName} acepto tu solicitud!</span>
            </div>

            <div className="flex flex-col gap-2.5 text-sm mb-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Prestador</span>
                <span className="font-medium text-gray-900 text-right">{booking.providerBusinessName}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Servicio</span>
                <span className="font-medium text-gray-900 text-right">{booking.serviceTitle}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Fecha</span>
                <span className="font-medium text-gray-900 text-right">{formatDateOrTBD(booking.scheduledAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Estado</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-100 text-green-800 px-2.5 py-1 rounded-full">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
                  Aceptado
                </span>
              </div>
            </div>

            <details className="group border border-gray-200 rounded-lg mb-5 [&::-webkit-details-marker]:hidden">
              <summary className="cursor-pointer list-none flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700">
                Ver detalles de la visita
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 transition-transform group-open:rotate-180"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </summary>
              <div className="px-3 pb-3 pt-1 border-t border-gray-100 flex flex-col gap-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Folio</span>
                  <span className="font-medium text-gray-900 text-right">{booking.folio}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Metodo de pago</span>
                  <span className="font-medium text-gray-900 text-right">{PAYMENT_METHOD_LABELS[booking.paymentMethod]} {formatCurrency(booking.agreedPrice)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Fecha de registro</span>
                  <span className="font-medium text-gray-900 text-right">{formatDate(booking.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Direccion de la visita</span>
                  <span className="text-gray-900">{booking.addressLine ? `${booking.addressLine}, ${booking.city}` : 'Por definir'}</span>
                </div>
                {booking.description && (
                  <div>
                    <span className="text-gray-500 block mb-0.5">Descripcion</span>
                    <BookingDescription description={booking.description} textClassName="text-gray-900" />
                  </div>
                )}
              </div>
            </details>

            <button onClick={handleCancel} disabled={working} className="btn-danger text-sm w-full">
              Cancelar contratacion
            </button>
          </div>
        ) : booking.status === 'EN_PROCESO' ? (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-indigo-600 mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
              <span className="text-base font-bold text-gray-900">{booking.providerBusinessName} esta trabajando en tu servicio</span>
            </div>

            <div className="flex flex-col gap-2.5 text-sm mb-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Prestador</span>
                <span className="font-medium text-gray-900 text-right">{booking.providerBusinessName}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Servicio</span>
                <span className="font-medium text-gray-900 text-right">{booking.serviceTitle}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Fecha</span>
                <span className="font-medium text-gray-900 text-right">{formatDateOrTBD(booking.scheduledAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Estado</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                  En proceso
                </span>
              </div>
            </div>

            <details className="group border border-gray-200 rounded-lg mb-5 [&::-webkit-details-marker]:hidden">
              <summary className="cursor-pointer list-none flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700">
                Ver detalles de la visita
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 transition-transform group-open:rotate-180"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </summary>
              <div className="px-3 pb-3 pt-1 border-t border-gray-100 flex flex-col gap-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Folio</span>
                  <span className="font-medium text-gray-900 text-right">{booking.folio}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Metodo de pago</span>
                  <span className="font-medium text-gray-900 text-right">{PAYMENT_METHOD_LABELS[booking.paymentMethod]} {formatCurrency(booking.agreedPrice)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Fecha de registro</span>
                  <span className="font-medium text-gray-900 text-right">{formatDate(booking.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Direccion de la visita</span>
                  <span className="text-gray-900">{booking.addressLine ? `${booking.addressLine}, ${booking.city}` : 'Por definir'}</span>
                </div>
                {booking.description && (
                  <div>
                    <span className="text-gray-500 block mb-0.5">Descripcion</span>
                    <BookingDescription description={booking.description} textClassName="text-gray-900" />
                  </div>
                )}
              </div>
            </details>

            <div className="bg-indigo-50 border border-dashed border-indigo-100 rounded-lg px-3 py-2.5 flex gap-2 items-start">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span className="text-xs text-indigo-700 leading-relaxed">
                Cuando termine, {booking.providerBusinessName} subira evidencias del trabajo y podras validarlo para liberar el pago.
              </span>
            </div>
          </div>
        ) : booking.status === 'CONCLUIDO' ? (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-purple-600 mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              <span className="text-base font-bold text-gray-900">{booking.providerBusinessName} concluyo el servicio</span>
            </div>

            <div className="flex flex-col gap-2.5 text-sm mb-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Prestador</span>
                <span className="font-medium text-gray-900 text-right">{booking.providerBusinessName}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Servicio</span>
                <span className="font-medium text-gray-900 text-right">{booking.serviceTitle}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Fecha</span>
                <span className="font-medium text-gray-900 text-right">{formatDateOrTBD(booking.scheduledAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Estado</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  Concluido
                </span>
              </div>
            </div>

            <details className="group border border-gray-200 rounded-lg mb-5 [&::-webkit-details-marker]:hidden">
              <summary className="cursor-pointer list-none flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700">
                Ver detalles de la visita
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 transition-transform group-open:rotate-180"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </summary>
              <div className="px-3 pb-3 pt-1 border-t border-gray-100 flex flex-col gap-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Folio</span>
                  <span className="font-medium text-gray-900 text-right">{booking.folio}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Metodo de pago</span>
                  <span className="font-medium text-gray-900 text-right">{PAYMENT_METHOD_LABELS[booking.paymentMethod]} {formatCurrency(booking.agreedPrice)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Fecha de registro</span>
                  <span className="font-medium text-gray-900 text-right">{formatDate(booking.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Direccion de la visita</span>
                  <span className="text-gray-900">{booking.addressLine ? `${booking.addressLine}, ${booking.city}` : 'Por definir'}</span>
                </div>
                {booking.description && (
                  <div>
                    <span className="text-gray-500 block mb-0.5">Descripcion</span>
                    <BookingDescription description={booking.description} textClassName="text-gray-900" />
                  </div>
                )}
              </div>
            </details>
          </div>
        ) : booking.status === 'APROBADO' ? (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-green-600 mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"></path></svg>
              <span className="text-base font-bold text-gray-900">Aprobaste el servicio de {booking.providerBusinessName}</span>
            </div>

            <div className="flex flex-col gap-2.5 text-sm mb-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Prestador</span>
                <span className="font-medium text-gray-900 text-right">{booking.providerBusinessName}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Servicio</span>
                <span className="font-medium text-gray-900 text-right">{booking.serviceTitle}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Fecha</span>
                <span className="font-medium text-gray-900 text-right">{formatDateOrTBD(booking.scheduledAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Estado</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-100 text-green-800 px-2.5 py-1 rounded-full">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"></path></svg>
                  Aprobado y pagado
                </span>
              </div>
            </div>

            <details className="group border border-gray-200 rounded-lg mb-5 [&::-webkit-details-marker]:hidden">
              <summary className="cursor-pointer list-none flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700">
                Ver detalles de la visita
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 transition-transform group-open:rotate-180"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </summary>
              <div className="px-3 pb-3 pt-1 border-t border-gray-100 flex flex-col gap-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Folio</span>
                  <span className="font-medium text-gray-900 text-right">{booking.folio}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Metodo de pago</span>
                  <span className="font-medium text-gray-900 text-right">{PAYMENT_METHOD_LABELS[booking.paymentMethod]} {formatCurrency(booking.agreedPrice)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Fecha de registro</span>
                  <span className="font-medium text-gray-900 text-right">{formatDate(booking.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Direccion de la visita</span>
                  <span className="text-gray-900">{booking.addressLine ? `${booking.addressLine}, ${booking.city}` : 'Por definir'}</span>
                </div>
                {booking.description && (
                  <div>
                    <span className="text-gray-500 block mb-0.5">Descripcion</span>
                    <BookingDescription description={booking.description} textClassName="text-gray-900" />
                  </div>
                )}
              </div>
            </details>
          </div>
        ) : booking.status === 'RECHAZADO' ? (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-red-600 mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
              <span className="text-base font-bold text-gray-900">{booking.providerBusinessName} rechazo tu solicitud</span>
            </div>

            <div className="flex flex-col gap-2.5 text-sm mb-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Prestador</span>
                <span className="font-medium text-gray-900 text-right">{booking.providerBusinessName}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Servicio</span>
                <span className="font-medium text-gray-900 text-right">{booking.serviceTitle}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Fecha</span>
                <span className="font-medium text-gray-900 text-right">{formatDateOrTBD(booking.scheduledAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Estado</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-800 px-2.5 py-1 rounded-full">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                  Rechazado
                </span>
              </div>
            </div>

            <details className="group border border-gray-200 rounded-lg mb-5 [&::-webkit-details-marker]:hidden">
              <summary className="cursor-pointer list-none flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700">
                Ver detalles de la visita
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 transition-transform group-open:rotate-180"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </summary>
              <div className="px-3 pb-3 pt-1 border-t border-gray-100 flex flex-col gap-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Folio</span>
                  <span className="font-medium text-gray-900 text-right">{booking.folio}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Metodo de pago</span>
                  <span className="font-medium text-gray-900 text-right">{PAYMENT_METHOD_LABELS[booking.paymentMethod]} {formatCurrency(booking.agreedPrice)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Fecha de registro</span>
                  <span className="font-medium text-gray-900 text-right">{formatDate(booking.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Direccion de la visita</span>
                  <span className="text-gray-900">{booking.addressLine ? `${booking.addressLine}, ${booking.city}` : 'Por definir'}</span>
                </div>
                {booking.description && (
                  <div>
                    <span className="text-gray-500 block mb-0.5">Descripcion</span>
                    <BookingDescription description={booking.description} textClassName="text-gray-900" />
                  </div>
                )}
              </div>
            </details>

            {!showResend && (
              <button type="button" onClick={() => setShowResend(true)} className="btn-primary text-sm w-full">
                Buscar otro prestador
              </button>
            )}
            {showResend && (
              <BookingResendPanel booking={booking} categoryName={booking.categoryName} onClose={() => setShowResend(false)} />
            )}
          </div>
        ) : (
          <>
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
                <p className="text-gray-600">{formatDateOrTBD(booking.scheduledAt)}</p>
                <p className="text-gray-600">{booking.addressLine ? `${booking.addressLine}, ${booking.city}` : 'Por definir'}</p>
              </div>
            </div>
          </>
        )}

        {!HIDE_SHARED_DETAILS_FOR.includes(booking.status) && booking.description && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">Descripcion</h3>
            <BookingDescription description={booking.description} textClassName="text-sm text-gray-600" />
          </div>
        )}

        {!HIDE_SHARED_DETAILS_FOR.includes(booking.status) && (
          <div className="flex justify-between items-center border-t border-gray-100 pt-4 mb-6">
            <span className="text-sm text-gray-500">Metodo de pago: {PAYMENT_METHOD_LABELS[booking.paymentMethod]}</span>
            <span className="text-lg font-bold text-gray-900">{formatCurrency(booking.agreedPrice)}</span>
          </div>
        )}

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
    </div>
  )
}
