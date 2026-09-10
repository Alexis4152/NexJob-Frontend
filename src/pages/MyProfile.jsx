import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNotify } from '../context/NotifyContext'
import { updateMe } from '../api/auth'

export default function MyProfile() {
  const { user, updateUserInMemory } = useAuth()
  const { notify } = useNotify()
  const [form, setForm] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', phone: user?.phone || '' })
  const [saving, setSaving] = useState(false)

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await updateMe(form)
      updateUserInMemory(res.data.data)
      notify('Perfil actualizado', 'success')
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo actualizar el perfil', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container-app py-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi cuenta</h1>
      <div className="card p-6">
        <p className="text-sm text-gray-500 mb-4">{user?.email}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="block text-gray-700 mb-1 font-medium">Nombre</span>
            <input required className="input" value={form.firstName} onChange={set('firstName')} />
          </label>
          <label className="block text-sm">
            <span className="block text-gray-700 mb-1 font-medium">Apellido</span>
            <input required className="input" value={form.lastName} onChange={set('lastName')} />
          </label>
          <label className="block text-sm">
            <span className="block text-gray-700 mb-1 font-medium">Telefono</span>
            <input className="input" value={form.phone} onChange={set('phone')} />
          </label>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}
