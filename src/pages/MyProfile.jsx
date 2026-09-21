import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotify } from '../context/NotifyContext'
import { updateMe, uploadMyPhoto } from '../api/auth'
import { getMyBookings } from '../api/bookings'
import { getMyQuoteRequests } from '../api/quoteRequests'
import { formatDateOnly } from '../utils/format'

export default function MyProfile() {
  const { user, updateUserInMemory } = useAuth()
  const { notify } = useNotify()
  const [form, setForm] = useState({
    firstName: user?.firstName || '', lastName: user?.lastName || '', phone: user?.phone || '',
    city: user?.city || '', postalCode: user?.postalCode || '', age: user?.age ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [counts, setCounts] = useState({ bookings: null, quoteRequests: null })

  useEffect(() => {
    getMyBookings({ page: 0, size: 1 }).then((r) => setCounts((c) => ({ ...c, bookings: r.data.data.totalElements })))
    getMyQuoteRequests({ size: 1 }).then((r) => setCounts((c) => ({ ...c, quoteRequests: r.data.data.totalElements })))
  }, [])

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await updateMe({ ...form, age: form.age === '' ? null : Number(form.age) })
      updateUserInMemory(res.data.data)
      notify('Perfil actualizado', 'success')
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo actualizar el perfil', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const res = await uploadMyPhoto(file)
      updateUserInMemory(res.data.data)
      notify('Foto de perfil actualizada', 'success')
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo subir la imagen', 'error')
    }
  }

  return (
    <div className="container-app py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi cuenta</h1>

      <div className="card p-4 mb-6 border-2 border-primary-200 flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 overflow-hidden">
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
              </svg>
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 bg-primary-600 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full cursor-pointer hover:bg-primary-700">
            Editar
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </label>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
          <p className="text-sm text-gray-500 truncate">{user?.email}</p>
          {user?.phone && <p className="text-sm text-gray-500 truncate">{user.phone}</p>}
          {user?.createdAt && <p className="text-xs text-gray-400 mt-1">Cliente desde {formatDateOnly(user.createdAt)}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Mis datos personales</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">Nombre</span>
                <input required className="input" value={form.firstName} onChange={set('firstName')} />
              </label>
              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">Apellido</span>
                <input required className="input" value={form.lastName} onChange={set('lastName')} />
              </label>
            </div>

            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Correo electronico</span>
              <input disabled className="input bg-gray-50 text-gray-500" value={user?.email || ''} />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">Numero de telefono</span>
                <input inputMode="numeric" maxLength={10} className="input" value={form.phone} onChange={set('phone')} />
              </label>
              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">
                  Edad <span className="text-gray-400 font-normal">(opcional)</span>
                </span>
                <input type="number" min={1} max={120} className="input" value={form.age} onChange={set('age')} />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">
                  Ciudad <span className="text-gray-400 font-normal">(opcional)</span>
                </span>
                <input className="input" value={form.city} onChange={set('city')} />
              </label>
              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">
                  Codigo postal <span className="text-gray-400 font-normal">(opcional)</span>
                </span>
                <input className="input" inputMode="numeric" maxLength={5} placeholder="Ej. 76000" value={form.postalCode} onChange={set('postalCode')} />
              </label>
            </div>
            <span className="text-xs text-gray-400 -mt-3 block">Los usamos para agendar servicios y pedir cotizaciones sin tener que capturarlos de nuevo cada vez.</span>

            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-20">
          <div className="card p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Resumen de mi cuenta</h2>
            <div className="flex flex-col gap-3">
              <Link to="/mis-contrataciones" className="flex items-center justify-between text-sm text-gray-600 hover:text-primary-700">
                <span>Contrataciones</span>
                <span className="font-semibold text-gray-900">{counts.bookings ?? '...'}</span>
              </Link>
              <Link to="/cotizaciones" className="flex items-center justify-between text-sm text-gray-600 hover:text-primary-700">
                <span>Cotizaciones solicitadas</span>
                <span className="font-semibold text-gray-900">{counts.quoteRequests ?? '...'}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
