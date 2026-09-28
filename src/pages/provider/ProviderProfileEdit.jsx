import { useEffect, useState } from 'react'
import { listCategories } from '../../api/categories'
import { getMyProviderProfile, updateMyProviderProfile, uploadMyProviderImage } from '../../api/providers'
import { updateMe } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'
import { useNotify } from '../../context/NotifyContext'
import RatingStars from '../../components/RatingStars'
import EmailVerificationModal from '../../components/EmailVerificationModal'
import { SERVICE_DAYS_LABELS, SERVICE_HOURS_LABELS } from '../../utils/providerSchedule'

export default function ProviderProfileEdit() {
  const { user, updateUserInMemory } = useAuth()
  const { notify } = useNotify()
  const [categories, setCategories] = useState([])
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({
    businessName: '', bio: '', yearsExperience: '', city: '', postalCode: '', categoryIds: [],
    serviceDays: '', serviceHours: '',
  })
  const [personalForm, setPersonalForm] = useState({ firstName: '', lastName: '', phone: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)

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
        city: p.city || '', postalCode: p.postalCode || '', categoryIds: p.categories.map((c) => c.id),
        serviceDays: p.serviceDays || '', serviceHours: p.serviceHours || '',
      })
    }).finally(() => setLoading(false))
  }, [])

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function setPersonal(field) {
    return (e) => setPersonalForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function toggleCategory(id) {
    setForm((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(id) ? f.categoryIds.filter((c) => c !== id) : [...f.categoryIds, id],
    }))
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

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await updateMyProviderProfile({
        ...form,
        yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : null,
        serviceDays: form.serviceDays || null,
        serviceHours: form.serviceHours || null,
      })
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
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Información</h1>

      <div className="card p-4 mb-6 border-2 border-primary-200 flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 overflow-hidden">
            {profile?.profileImageUrl ? (
              <img src={profile.profileImageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4 4-6 8-6s8 2 8 6"></path></svg>
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 bg-primary-600 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full cursor-pointer hover:bg-primary-700">
            Editar
            <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </label>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{personalForm.firstName} {personalForm.lastName}</p>
          <p className="text-sm text-gray-500 truncate">{user?.email}</p>
          {personalForm.phone && <p className="text-sm text-gray-500 truncate">{personalForm.phone}</p>}
          <div className="flex items-center gap-2 mt-1">
            <RatingStars value={profile?.averageRating} size="text-xs" />
            <span className="text-xs text-gray-500">({profile?.totalReviews ?? 0} resenas)</span>
            {profile?.isVerified && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">Verificado</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Mi negocio</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Nombre del negocio u oficio</span>
              <input required className="input" value={form.businessName} onChange={set('businessName')} />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">Estado/Ciudad donde ofreces tus servicios</span>
                <input required className="input" value={form.city} onChange={set('city')} />
              </label>
              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">
                  Código Postal <span className="text-gray-400 font-normal">(opcional)</span>
                </span>
                <input className="input" inputMode="numeric" maxLength={5} placeholder="Ej. 06000"
                  value={form.postalCode} onChange={set('postalCode')} />
                <span className="block text-xs text-gray-400 mt-1">Nos ayuda a mostrarte a clientes cercanos con más precisión.</span>
              </label>
            </div>

            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Años de experiencia</span>
              <input type="number" min={0} className="input" value={form.yearsExperience} onChange={set('yearsExperience')} />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">
                  Días de servicio <span className="text-gray-400 font-normal">(opcional)</span>
                </span>
                <select className="input" value={form.serviceDays} onChange={set('serviceDays')}>
                  <option value="">Selecciona</option>
                  {Object.entries(SERVICE_DAYS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">
                  Horario de servicio <span className="text-gray-400 font-normal">(opcional)</span>
                </span>
                <select className="input" value={form.serviceHours} onChange={set('serviceHours')}>
                  <option value="">Selecciona</option>
                  {Object.entries(SERVICE_HOURS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Sobre tu trabajo</span>
              <textarea
                className="input"
                rows={3}
                placeholder="Ej. Soy plomero certificado con 8 años de experiencia. Me gusta explicar cada paso antes de empezar y no me voy hasta que quedes satisfecho."
                value={form.bio}
                onChange={set('bio')}
              />
              <span className="block text-xs text-gray-400 mt-1">
                Esta es tu presentación personal para el cliente (quién eres, cómo trabajas), no la lista de servicios que ofreces — esos los agregas por separado en "Mis servicios".
              </span>
            </label>

            <div>
              <span className="block text-gray-700 mb-2 text-sm font-medium">Categorías de servicio</span>
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

        <div className="card p-6 lg:sticky lg:top-6">
          <h2 className="font-semibold text-gray-900 mb-4">Mis datos personales</h2>
          <form onSubmit={handlePersonalSubmit} className="space-y-4">
            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Nombre</span>
              <input required className="input" value={personalForm.firstName} onChange={setPersonal('firstName')} />
            </label>
            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Apellido</span>
              <input required className="input" value={personalForm.lastName} onChange={setPersonal('lastName')} />
            </label>
            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Correo electrónico</span>
              <input disabled className="input bg-gray-50 text-gray-500" value={user?.email || ''} />
            </label>

            {user?.emailVerified ? (
              <p className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
                Correo verificado
              </p>
            ) : (
              <button type="button" onClick={() => setShowVerifyModal(true)} className="btn-primary text-sm">
                Verificar correo
              </button>
            )}
            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Número de teléfono</span>
              <input inputMode="numeric" maxLength={10} className="input" value={personalForm.phone} onChange={setPersonal('phone')} />
            </label>

            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? 'Guardando...' : 'Guardar datos personales'}
            </button>
          </form>
        </div>
      </div>

      <EmailVerificationModal open={showVerifyModal} onClose={() => setShowVerifyModal(false)} />
    </div>
  )
}
