import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProviderCalendar } from '../../api/bookings'
import StatusBadge from '../../components/StatusBadge'
import { formatCurrency } from '../../utils/format'

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function pad(n) {
  return String(n).padStart(2, '0')
}

function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toLocalIso(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function todayKey() {
  return dateKey(new Date())
}

export default function ProviderCalendar() {
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedKey, setSelectedKey] = useState(todayKey())

  useEffect(() => {
    const from = new Date(cursor.getFullYear(), cursor.getMonth(), 1, 0, 0, 0)
    const to = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59)
    setLoading(true)
    getProviderCalendar({ from: toLocalIso(from), to: toLocalIso(to) })
      .then((r) => setBookings(r.data.data))
      .finally(() => setLoading(false))
  }, [cursor])

  const byDay = useMemo(() => {
    const map = {}
    for (const b of bookings) {
      const key = dateKey(new Date(b.scheduledAt))
      if (!map[key]) map[key] = []
      map[key].push(b)
    }
    return map
  }, [bookings])

  const cells = useMemo(() => {
    const firstDay = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    const leading = firstDay.getDay()
    const result = []
    for (let i = 0; i < leading; i++) result.push(null)
    for (let day = 1; day <= daysInMonth; day++) {
      result.push(new Date(cursor.getFullYear(), cursor.getMonth(), day))
    }
    return result
  }, [cursor])

  function changeMonth(delta) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))
  }

  const selectedBookings = (byDay[selectedKey] || []).slice().sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Calendario de visitas</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => changeMonth(-1)} className="btn-secondary text-sm px-3 py-1.5">← Anterior</button>
            <h2 className="font-semibold text-gray-900">{MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}</h2>
            <button onClick={() => changeMonth(1)} className="btn-secondary text-sm px-3 py-1.5">Siguiente →</button>
          </div>

          {loading ? (
            <p className="text-gray-500 text-sm">Cargando...</p>
          ) : (
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((w) => (
                <div key={w} className="text-xs font-medium text-gray-500 py-1">{w}</div>
              ))}
              {cells.map((d, i) => {
                if (!d) return <div key={`empty-${i}`} />
                const key = dateKey(d)
                const dayBookings = byDay[key] || []
                const isSelected = key === selectedKey
                const isToday = key === todayKey()
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedKey(key)}
                    className={`aspect-square rounded-lg text-xs sm:text-sm p-0.5 sm:p-1 flex flex-col items-center justify-center gap-0.5 border transition-colors ${
                      isSelected
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : dayBookings.length > 0
                          ? 'border-amber-200 bg-amber-50 text-gray-800 hover:border-primary-400'
                          : 'border-transparent text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className={isToday ? 'font-bold underline' : ''}>{d.getDate()}</span>
                    {dayBookings.length > 0 && (
                      <span className="min-w-[18px] h-[18px] sm:min-w-[22px] sm:h-[22px] px-1 flex items-center justify-center text-xs sm:text-sm font-bold leading-none bg-red-500 text-white rounded-full shadow-sm ring-2 ring-white">{dayBookings.length}</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="card p-4">
          <h3 className="font-semibold text-gray-900 mb-3">
            {selectedBookings.length > 0 ? `Visitas del ${selectedKey.split('-').reverse().join('/')}` : 'Sin visitas ese dia'}
          </h3>
          {selectedBookings.length === 0 ? (
            <p className="text-sm text-gray-500">No tienes servicios agendados en esta fecha. Esta libre para nuevas contrataciones.</p>
          ) : (
            <div className="space-y-3">
              {selectedBookings.map((b) => (
                <Link key={b.id} to={`/prestador/contrataciones/${b.id}`} className="block border border-gray-100 rounded-lg p-3 hover:border-primary-300 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">
                      {new Date(b.scheduledAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-sm text-gray-700">{b.serviceTitle}</p>
                  <p className="text-xs text-gray-500">{b.clientFullName}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatCurrency(b.agreedPrice)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
