import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProviderBoard, getProviderDashboard, updateBookingStatus } from '../../api/bookings'
import { useNotify } from '../../context/NotifyContext'
import { formatCurrency, formatDateOrTBD } from '../../utils/format'

const SECTIONS = [
  { key: 'SOLICITADO', title: 'Solicitudes', statuses: ['SOLICITADO'], border: 'border-l-gray-400', dot: 'bg-gray-400' },
  { key: 'COTIZADO', title: 'Cotizadas', statuses: ['COTIZADO'], border: 'border-l-blue-400', dot: 'bg-blue-400' },
  { key: 'COTIZACION_ACEPTADA', title: 'Cotizacion aceptada', statuses: ['COTIZACION_ACEPTADA'], border: 'border-l-teal-400', dot: 'bg-teal-400' },
  { key: 'ACEPTADO', title: 'Por hacer', statuses: ['ACEPTADO'], border: 'border-l-yellow-400', dot: 'bg-yellow-400' },
  { key: 'EN_PROCESO', title: 'En proceso', statuses: ['EN_PROCESO'], border: 'border-l-green-500', dot: 'bg-green-500' },
  { key: 'CONCLUIDO', title: 'Concluidos', statuses: ['CONCLUIDO', 'APROBADO'], border: 'border-l-blue-500', dot: 'bg-blue-500' },
  { key: 'CANCELADO', title: 'Canceladas / aplazadas', statuses: ['CANCELADO', 'RECHAZADO'], border: 'border-l-red-500', dot: 'bg-red-500' },
]

// A que estado pasa una tarjeta cuando se suelta sobre cada seccion (arrastrar = avanzar).
// "Cotizadas" y "Cotizacion aceptada" no son arrastrables: la primera depende de que el cliente
// acepte, la segunda requiere confirmar explicitamente desde su boton "Confirmar".
const DROP_TARGET_STATUS = { SOLICITADO: 'SOLICITADO', COTIZADO: null, COTIZACION_ACEPTADA: null, ACEPTADO: 'ACEPTADO', EN_PROCESO: 'EN_PROCESO', CONCLUIDO: null, CANCELADO: null }
const NOT_DRAGGABLE = ['COTIZADO', 'COTIZACION_ACEPTADA', 'CONCLUIDO', 'CANCELADO']

// Cuantas tarjetas se muestran por seccion antes de necesitar "Ver todos".
const VISIBLE_LIMIT = 3

/**
 * Tablero del prestador: una seccion por estado (de arriba a abajo), con las tarjetas de cada
 * seccion en una fila horizontal. Arrastrar una tarjeta a la seccion vecina la avanza de
 * estado (Solicitudes -> Por hacer = aceptar, Por hacer -> En proceso = iniciar). Pasar a
 * "Concluidos" requiere subir evidencia primero, asi que esa transicion solo se hace desde
 * el detalle de la contratacion.
 */
export default function ProviderDashboard() {
  const navigate = useNavigate()
  const { notify } = useNotify()
  const [bookings, setBookings] = useState([])
  const [proximasVisitas, setProximasVisitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [dragId, setDragId] = useState(null)
  const [expandedSections, setExpandedSections] = useState({})

  function toggleExpanded(sectionKey) {
    setExpandedSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }))
  }

  function load() {
    setLoading(true)
    getProviderBoard().then((r) => setBookings(r.data.data)).finally(() => setLoading(false))
    getProviderDashboard().then((r) => setProximasVisitas(r.data.data.proximasVisitas)).catch(() => {})
  }

  useEffect(() => { load() }, [])

  async function moveTo(booking, newStatus) {
    try {
      await updateBookingStatus(booking.id, newStatus)
      notify('Contratacion actualizada', 'success')
      load()
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo mover la contratacion', 'error')
    }
  }

  async function reject(booking) {
    try {
      await updateBookingStatus(booking.id, 'RECHAZADO', 'Rechazado por el prestador')
      notify('Solicitud rechazada', 'success')
      load()
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo rechazar', 'error')
    }
  }

  async function cancel(booking) {
    try {
      await updateBookingStatus(booking.id, 'CANCELADO', 'Cancelado por el prestador')
      notify('Contratacion cancelada', 'success')
      load()
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo cancelar', 'error')
    }
  }

  function handleDrop(sectionKey) {
    const target = DROP_TARGET_STATUS[sectionKey]
    const booking = bookings.find((b) => b.id === dragId)
    setDragId(null)
    if (!booking || !target || booking.status === target) return
    moveTo(booking, target)
  }

  if (loading) return <p className="text-gray-500">Cargando tablero...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Tablero de trabajos</h1>

      {proximasVisitas.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6 text-sm">
          <span className="text-gray-500">Proximas visitas:</span>
          {proximasVisitas.map((b) => (
            <button
              key={b.id}
              onClick={() => navigate(`/prestador/contrataciones/${b.id}`)}
              className="bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full hover:bg-primary-100"
            >
              {formatDateOrTBD(b.scheduledAt)} · {b.serviceTitle}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-6">
        {SECTIONS.map((section) => {
          const items = bookings.filter((b) => section.statuses.includes(b.status))
          const isExpanded = !!expandedSections[section.key]
          const hasMore = items.length > VISIBLE_LIMIT
          const visibleItems = isExpanded ? items : items.slice(0, VISIBLE_LIMIT)
          return (
            <div
              key={section.key}
              className="bg-gray-50 rounded-xl p-4"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(section.key)}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${section.dot}`} />
                <h2 className="font-semibold text-gray-700 text-sm">{section.title}</h2>
                <span className="text-xs bg-white text-gray-500 px-2 py-0.5 rounded-full">{items.length}</span>
                {hasMore && (
                  <button
                    onClick={() => toggleExpanded(section.key)}
                    className="ml-auto text-xs font-medium text-primary-700 hover:underline"
                  >
                    {isExpanded ? 'Ver menos' : `Ver todos (${items.length})`}
                  </button>
                )}
              </div>

              {items.length === 0 ? (
                <p className="text-xs text-gray-400 py-4">Sin contrataciones aqui</p>
              ) : (
                <div className={isExpanded ? 'flex flex-wrap gap-3' : 'flex gap-3 overflow-x-auto pb-2'}>
                  {visibleItems.map((b) => (
                    <div
                      key={b.id}
                      draggable={!NOT_DRAGGABLE.includes(section.key)}
                      onDragStart={() => setDragId(b.id)}
                      onClick={() => navigate(`/prestador/contrataciones/${b.id}`)}
                      className={`bg-white rounded-lg shadow-sm p-3 cursor-pointer hover:shadow-md transition-shadow w-72 shrink-0 border-l-4 border-b-4 border-b-gray-200 ${section.border}`}
                    >
                      <p className="font-medium text-sm text-gray-900">{b.serviceTitle}</p>
                      <p className="text-xs text-gray-500 mb-2">{b.clientFullName}</p>

                      <p className="text-xs text-gray-400">Folio</p>
                      <p className="text-sm font-mono text-gray-700 mb-2">{b.folio}</p>

                      <p className="text-xs text-gray-400 mb-1">Fecha de inicio</p>
                      <span className="inline-block bg-gray-900 text-white text-xs px-2 py-1 rounded-md">
                        {formatDateOrTBD(b.scheduledAt)}
                      </span>

                      <p className="text-sm font-semibold text-gray-800 mt-2">
                        {b.status === 'COTIZADO'
                          ? formatCurrency(b.quoteTotal)
                          : b.status === 'SOLICITADO' && b.priceType === 'COTIZACION'
                            ? `Desde ${formatCurrency(b.agreedPrice)} (a cotizar)`
                            : formatCurrency(b.agreedPrice)}
                      </p>

                      {section.key === 'SOLICITADO' && (
                        <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                          {b.priceType === 'COTIZACION' ? (
                            <button onClick={() => navigate(`/prestador/contrataciones/${b.id}/cotizar`)} className="btn-primary text-xs flex-1 py-1">Cotizar</button>
                          ) : (
                            <button onClick={() => moveTo(b, 'ACEPTADO')} className="btn-primary text-xs flex-1 py-1">Aceptar</button>
                          )}
                          <button onClick={() => reject(b)} className="btn-danger text-xs flex-1 py-1">Rechazar</button>
                        </div>
                      )}
                      {section.key === 'COTIZADO' && (
                        <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-2 py-1.5 mt-3">
                          Cotizacion enviada, esperando respuesta del cliente
                        </p>
                      )}
                      {section.key === 'COTIZACION_ACEPTADA' && (
                        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                          <p className="text-xs text-teal-700 bg-teal-50 rounded-lg px-2 py-1.5 mb-2">
                            El cliente acepto el precio, confirma para agendar la visita
                          </p>
                          <div className="flex gap-2">
                            <button onClick={() => moveTo(b, 'ACEPTADO')} className="btn-primary text-xs flex-1 py-1">Confirmar</button>
                            <button onClick={() => cancel(b)} className="btn-danger text-xs flex-1 py-1">Cancelar</button>
                          </div>
                        </div>
                      )}
                      {section.key === 'ACEPTADO' && (
                        <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => moveTo(b, 'EN_PROCESO')} className="btn-primary text-xs flex-1 py-1">Iniciar</button>
                          <button onClick={() => cancel(b)} className="btn-danger text-xs flex-1 py-1">Cancelar</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
