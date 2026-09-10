import { useEffect, useState } from 'react'
import { adminListSupportTickets, adminResolveSupportTicket } from '../../api/support'
import { useNotify } from '../../context/NotifyContext'
import AdminPagination from '../../components/AdminPagination'
import { formatDate } from '../../utils/format'

const STATUSES = ['', 'ABIERTO', 'EN_REVISION', 'RESUELTO', 'CERRADO']

export default function AdminSupport() {
  const { notify } = useNotify()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [result, setResult] = useState({ content: [], totalPages: 0, totalElements: 0 })
  const [loading, setLoading] = useState(true)
  const [responses, setResponses] = useState({})

  function load() {
    setLoading(true)
    adminListSupportTickets({ status: status || undefined, page, size: 20 }).then((r) => setResult(r.data.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, status])

  async function handleResolve(ticket, newStatus) {
    try {
      await adminResolveSupportTicket(ticket.id, { status: newStatus, adminResponse: responses[ticket.id] ?? ticket.adminResponse ?? '' })
      notify('Ticket actualizado', 'success')
      load()
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo actualizar el ticket', 'error')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Soporte y reportes</h1>

      <div className="card p-4 mb-4 flex items-end gap-3">
        <div className="min-w-[200px]">
          <label className="text-xs font-medium text-gray-600 block mb-1">Estado</label>
          <select className="input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0) }}>
            {STATUSES.map((s) => <option key={s} value={s}>{s || 'Todos los estados'}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : result.content.length === 0 ? (
        <p className="text-gray-500">Sin tickets con ese filtro.</p>
      ) : (
        <div className="space-y-3">
          {result.content.map((t) => (
            <div key={t.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <span className="font-semibold text-gray-900">{t.subject}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t.category}</span>
              </div>
              <p className="text-xs text-gray-400">{t.contactEmail} · {formatDate(t.createdAt)}</p>
              <p className="text-sm text-gray-600 mt-2">{t.message}</p>

              <textarea
                className="input mt-3"
                rows={2}
                placeholder="Respuesta para el usuario (opcional)"
                defaultValue={t.adminResponse || ''}
                onChange={(e) => setResponses((r) => ({ ...r, [t.id]: e.target.value }))}
              />

              <div className="flex flex-wrap gap-2 mt-2">
                <button onClick={() => handleResolve(t, 'EN_REVISION')} className="btn-secondary text-xs">En revision</button>
                <button onClick={() => handleResolve(t, 'RESUELTO')} className="btn-primary text-xs">Marcar resuelto</button>
                <button onClick={() => handleResolve(t, 'CERRADO')} className="btn-secondary text-xs">Cerrar</button>
                <span className="text-xs text-gray-400 ml-auto self-center">Estado actual: {t.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminPagination
        page={result.page} size={20} totalPages={result.totalPages} totalElements={result.totalElements}
        contentLength={result.content.length} onPageChange={setPage}
      />
    </div>
  )
}
