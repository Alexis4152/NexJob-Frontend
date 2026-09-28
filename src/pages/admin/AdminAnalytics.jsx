import { useEffect, useState } from 'react'
import { getAnalyticsSummary } from '../../api/analytics'
import { formatResponseTime } from '../../utils/format'

const SUMMARY_CARDS = [
  { key: 'Today', label: 'Hoy', icon: '📅' },
  { key: 'Last7Days', label: 'Ultimos 7 dias', icon: '🗓️' },
  { key: 'Last30Days', label: 'Ultimos 30 dias', icon: '📈' },
]

// "2026-09-25" -> "25 sep". Construido con componentes locales (no new Date(string), que
// interpreta la fecha como UTC y puede mostrar el dia anterior segun el huso horario).
function formatDayLabel(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

function formatAvgDuration(seconds) {
  if (seconds === null || seconds === undefined) return 'Sin datos aun'
  if (seconds < 60) return `~${Math.round(seconds)} seg`
  return formatResponseTime(seconds / 60)
}

export default function AdminAnalytics() {
  const [data, setData] = useState(null)
  const [hovered, setHovered] = useState(null)

  useEffect(() => { getAnalyticsSummary().then((r) => setData(r.data.data)) }, [])

  if (!data) return <p className="text-gray-500">Cargando...</p>

  const maxVisits = Math.max(1, ...data.dailyBreakdown.map((d) => d.visits))
  const maxTopPathVisits = Math.max(1, ...data.topPaths.map((p) => p.visits))

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Analitica de visitas</h1>
      <p className="text-sm text-gray-500 mb-6">
        Trafico anonimo del sitio (sin necesidad de registro), para saber a cuanta gente llega la plataforma.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {SUMMARY_CARDS.map((c) => (
          <div key={c.key} className="card p-5">
            <span className="text-2xl">{c.icon}</span>
            <p className="text-2xl font-bold text-gray-900 mt-2">{data[`visits${c.key}`]}</p>
            <p className="text-sm text-gray-500">Visitas &middot; {c.label}</p>
            <p className="text-xs text-gray-400 mt-1">{data[`uniqueVisitors${c.key}`]} visitantes unicos</p>
          </div>
        ))}
        <div className="card p-5">
          <span className="text-2xl">⏱️</span>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatAvgDuration(data.avgDurationSecondsLast30Days)}</p>
          <p className="text-sm text-gray-500">Tiempo promedio en pagina</p>
          <p className="text-xs text-gray-400 mt-1">Aproximado, ultimos 30 dias</p>
        </div>
      </div>

      <div className="card p-5 mb-8">
        <h2 className="font-semibold text-gray-900 mb-4 text-sm">Visitas por dia (ultimos 30 dias)</h2>
        <div className="flex items-end gap-1 h-40">
          {data.dailyBreakdown.map((d, i) => {
            const heightPct = Math.max(3, Math.round((d.visits / maxVisits) * 100))
            const showLabel = i === 0 || i === data.dailyBreakdown.length - 1 || i % 5 === 0
            return (
              <div key={d.date} className="relative flex-1 h-full flex flex-col justify-end items-center group">
                {hovered === d.date && (
                  <div className="absolute bottom-full mb-1.5 z-10 bg-gray-900 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                    <p className="font-semibold">{formatDayLabel(d.date)}</p>
                    <p>{d.visits} visita{d.visits === 1 ? '' : 's'}</p>
                    <p className="text-gray-300">{d.uniqueVisitors} unicos</p>
                  </div>
                )}
                <div
                  onMouseEnter={() => setHovered(d.date)}
                  onMouseLeave={() => setHovered(null)}
                  className="w-full bg-primary-600 group-hover:bg-primary-700 rounded-t transition-colors cursor-default"
                  style={{ height: `${heightPct}%` }}
                />
                <span className="text-[10px] text-gray-400 mt-1.5 h-3">{showLabel ? formatDayLabel(d.date) : ''}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4 text-sm">Paginas mas visitadas (ultimos 30 dias)</h2>
        {data.topPaths.length === 0 ? (
          <p className="text-sm text-gray-400">Aun no hay suficientes visitas registradas.</p>
        ) : (
          <div className="space-y-3">
            {data.topPaths.map((p) => (
              <div key={p.path} className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-600 w-40 sm:w-64 truncate shrink-0">{p.path}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-primary-600 h-full rounded-full" style={{ width: `${Math.round((p.visits / maxTopPathVisits) * 100)}%` }} />
                </div>
                <span className="text-sm font-semibold text-gray-900 w-10 text-right shrink-0">{p.visits}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
