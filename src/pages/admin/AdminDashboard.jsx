import { useEffect, useState } from 'react'
import { adminGetDashboard } from '../../api/bookings'
import { formatCurrency } from '../../utils/format'

const CARDS = [
  { key: 'totalClients', label: 'Clientes registrados', icon: '👥' },
  { key: 'totalProviders', label: 'Prestadores registrados', icon: '🛠️' },
  { key: 'totalBookings', label: 'Contrataciones totales', icon: '📋' },
  { key: 'bookingsInProgress', label: 'Servicios en proceso', icon: '⏳' },
  { key: 'bookingsCompleted', label: 'Servicios concluidos y pagados', icon: '✅' },
  { key: 'openSupportTickets', label: 'Tickets de ayuda abiertos', icon: '💬' },
]

export default function AdminDashboard() {
  const [data, setData] = useState(null)

  useEffect(() => { adminGetDashboard().then((r) => setData(r.data.data)) }, [])

  if (!data) return <p className="text-gray-500">Cargando...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CARDS.map((c) => (
          <div key={c.key} className="card p-5">
            <span className="text-2xl">{c.icon}</span>
            <p className="text-2xl font-bold text-gray-900 mt-2">{data[c.key]}</p>
            <p className="text-sm text-gray-500">{c.label}</p>
          </div>
        ))}
        <div className="card p-5">
          <span className="text-2xl">💰</span>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(data.totalPaymentsReleased)}</p>
          <p className="text-sm text-gray-500">Pagos liberados a prestadores</p>
        </div>
      </div>
    </div>
  )
}
