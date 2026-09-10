import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNotify } from '../context/NotifyContext'
import { createSupportTicket, getMySupportTickets } from '../api/support'
import { formatDate } from '../utils/format'

const CATEGORIES = [
  { value: 'PROBLEMA_TECNICO', label: 'Problema tecnico con la plataforma' },
  { value: 'QUEJA_SERVICIO', label: 'Queja sobre un servicio contratado' },
  { value: 'SUGERENCIA', label: 'Sugerencia' },
  { value: 'OTRO', label: 'Otro' },
]

/** Modulo de ayuda: reportar un problema, una queja sobre un servicio o dejar una sugerencia. */
export default function Help() {
  const { user } = useAuth()
  const { notify } = useNotify()
  const [form, setForm] = useState({ contactEmail: user?.email || '', subject: '', category: 'PROBLEMA_TECNICO', message: '' })
  const [sending, setSending] = useState(false)
  const [tickets, setTickets] = useState([])

  useEffect(() => {
    if (user) getMySupportTickets().then((r) => setTickets(r.data.data.content)).catch(() => {})
  }, [user])

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSending(true)
    try {
      await createSupportTicket(form)
      notify('Recibimos tu reporte, te contactaremos pronto', 'success')
      setForm((f) => ({ ...f, subject: '', message: '' }))
      if (user) getMySupportTickets().then((r) => setTickets(r.data.data.content))
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo enviar tu reporte', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container-app py-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Centro de ayuda</h1>
      <p className="text-gray-600 mb-6">¿Tuviste un problema con la plataforma o con un servicio contratado? Cuentanos y te contactaremos por correo.</p>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="block text-gray-700 mb-1 font-medium">Correo de contacto</span>
            <input required type="email" className="input" value={form.contactEmail} onChange={set('contactEmail')} />
          </label>
          <label className="block text-sm">
            <span className="block text-gray-700 mb-1 font-medium">Tipo de reporte</span>
            <select className="input" value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="block text-gray-700 mb-1 font-medium">Asunto</span>
            <input required className="input" value={form.subject} onChange={set('subject')} />
          </label>
          <label className="block text-sm">
            <span className="block text-gray-700 mb-1 font-medium">Describe tu problema o comentario</span>
            <textarea required className="input" rows={4} value={form.message} onChange={set('message')} />
          </label>
          <button type="submit" disabled={sending} className="btn-primary w-full">
            {sending ? 'Enviando...' : 'Enviar reporte'}
          </button>
        </form>
      </div>

      {user && tickets.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Mis reportes anteriores</h2>
          <div className="space-y-3">
            {tickets.map((t) => (
              <div key={t.id} className="card p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-medium text-gray-900">{t.subject}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full shrink-0">{t.status}</span>
                </div>
                <p className="text-xs text-gray-400">{formatDate(t.createdAt)}</p>
                <p className="text-sm text-gray-600 mt-1">{t.message}</p>
                {t.adminResponse && (
                  <div className="mt-2 bg-primary-50 text-primary-800 text-sm rounded-lg p-2">
                    <span className="font-medium">Respuesta: </span>{t.adminResponse}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
