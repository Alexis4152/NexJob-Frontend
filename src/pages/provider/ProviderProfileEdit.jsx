import { useEffect, useState } from 'react'
import { listCategories } from '../../api/categories'
import { getMyProviderProfile, updateMyProviderProfile, uploadMyProviderImage } from '../../api/providers'
import { updateMe } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'
import { useNotify } from '../../context/NotifyContext'
import RatingStars from '../../components/RatingStars'

export default function ProviderProfileEdit() {
  const { user, updateUserInMemory } = useAuth()
  const { notify } = useNotify()
  const [categories, setCategories] = useState([])
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ businessName: '', bio: '', yearsExperience: '', city: '', categoryIds: [] })
  const [personalForm, setPersonalForm] = useState({ firstName: '', lastName: '', phone: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) setPersonalForm({ firstName: user.firstName || '', lastName: user.lastName || '', phone: user.phone || '' })
  }, [user])

  useEffect(() => {
    listCategories().then((r) => setCategories(r.data.data))
    getMyProviderProfile().then((r) => {
      const p = r.data.data
      setProfile(p)
      setForm({
        businessName: p.businessName, bio: p.bio || '', yearsExperience: p.yearsExperience || '',
        city: p.city, categoryIds: p.categories.map((c) => c.id),
      })
    }).finally(() => setLoading(false))
  }, [])

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function setPersonal(field) {
    return (e) => setPersonalForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handlePersonalSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await updateMe(personalForm)
      updateUserInMemory(res.data.data)
      notify('Datos personales actualizados', 'success')
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudieron actualizar tus datos', 'error')
    } finally {
      setSaving(false)
    }
  }

  function toggleCategory(id) {
    setForm((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(id) ? f.categoryIds.filter((c) => c !== id) : [...f.categoryIds, id],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await updateMyProviderProfile({ ...form, yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : null })
      setProfile(res.data.data)
      notify('Perfil actualizado', 'success')
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo actualizar el perfil', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const res = await uploadMyProviderImage(file)
      setProfile(res.data.data)
      notify('Foto de perfil actualizada', 'success')
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo subir la imagen', 'error')
    }
  }

  if (loading) return <p className="text-gray-500">Cargando...</p>

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi perfil de prestador</h1>

      <div className="card p-6 mb-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl overflow-hidden shrink-0">
          {profile?.profileImageUrl ? <img src={profile.profileImageUrl} alt="" className="w-full h-full object-cover" /> : <span role="img" aria-label="Prestador de servicio">👷</span>}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <RatingStars value={profile?.averageRating} />
            <span className="text-sm text-gray-500">({profile?.totalReviews ?? 0} resenas)</span>
          </div>
          {profile?.isVerified && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full mt-1 inline-block">Verificado</span>}
          <label className="block text-xs text-primary-700 mt-2 cursor-pointer hover:underline">
            Cambiar foto
            <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </label>
        </div>
      </div>

      <div className="card p-6 mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">Mis datos personales</h2>
        <form onSubmit={handlePersonalSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="block text-gray-700 mb-1 font-medium">Correo</span>
            <input disabled className="input bg-gray-50 text-gray-500" value={user?.email || ''} />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Nombre</span>
              <input required className="input" value={personalForm.firstName} onChange={setPersonal('firstName')} />
            </label>
            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Apellido</span>
              <input required className="input" value={personalForm.lastName} onChange={setPersonal('lastName')} />
            </label>
          </div>
          <label className="block text-sm">
            <span className="block text-gray-700 mb-1 font-medium">Telefono</span>
            <input className="input" value={personalForm.phone} onChange={setPersonal('phone')} />
          </label>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Guardando...' : 'Guardar datos personales'}
          </button>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Mi negocio</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="block text-gray-700 mb-1 font-medium">Nombre del negocio u oficio</span>
            <input required className="input" value={form.businessName} onChange={set('businessName')} />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Ciudad</span>
              <input required className="input" value={form.city} onChange={set('city')} />
            </label>
            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Anos de experiencia</span>
              <input type="number" min={0} className="input" value={form.yearsExperience} onChange={set('yearsExperience')} />
            </label>
          </div>
          <label className="block text-sm">
            <span className="block text-gray-700 mb-1 font-medium">Sobre tu trabajo</span>
            <textarea className="input" rows={3} value={form.bio} onChange={set('bio')} />
          </label>
          <div>
            <span className="block text-gray-700 mb-2 text-sm font-medium">Categorias de servicio</span>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => toggleCategory(c.id)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    form.categoryIds.includes(c.id)
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-primary-400'
                  }`}
                >
                  {c.icon} {c.name}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}
