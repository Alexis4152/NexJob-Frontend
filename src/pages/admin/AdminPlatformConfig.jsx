import { useEffect, useState } from 'react'
import {
  adminGetPlatformConfig, adminUpdatePlatformConfig, adminUploadPlatformLogo,
  adminGetEmailConfig, adminUpdateEmailConfig,
} from '../../api/platformConfig'
import { useNotify } from '../../context/NotifyContext'
import { applyBrandColor } from '../../utils/theme'

export default function AdminPlatformConfig() {
  const { notify } = useNotify()
  const [form, setForm] = useState(null)
  const [emailForm, setEmailForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)

  useEffect(() => {
    Promise.all([adminGetPlatformConfig(), adminGetEmailConfig()])
      .then(([platform, email]) => {
        setForm(platform.data.data)
        setEmailForm({ ...email.data.data, smtpPassword: '' })
      })
      .finally(() => setLoading(false))
  }, [])

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function setEmail(field) {
    return (e) => setEmailForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await adminUpdatePlatformConfig(form)
      setForm(res.data.data)
      applyBrandColor(res.data.data.primaryColor)
      notify('Configuracion actualizada', 'success')
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo guardar la configuracion', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const res = await adminUploadPlatformLogo(file)
      setForm(res.data.data)
      notify('Logo actualizado', 'success')
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo subir el logo', 'error')
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault()
    setSavingEmail(true)
    try {
      const res = await adminUpdateEmailConfig(emailForm)
      setEmailForm({ ...res.data.data, smtpPassword: '' })
      notify('Configuracion de correo actualizada', 'success')
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo guardar la configuracion de correo', 'error')
    } finally {
      setSavingEmail(false)
    }
  }

  if (loading || !form || !emailForm) return <p className="text-gray-500">Cargando...</p>

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuracion de la plataforma</h1>
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-primary-100 overflow-hidden flex items-center justify-center shrink-0">
              {form.logoUrl ? <img src={form.logoUrl} alt="" className="w-full h-full object-cover" /> : '🏢'}
            </div>
            <label className="text-sm text-primary-700 cursor-pointer hover:underline">
              Cambiar logo
              <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
            </label>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Nombre de la plataforma</span>
              <input required className="input" value={form.platformName} onChange={set('platformName')} />
            </label>
            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Razon social</span>
              <input className="input" value={form.legalName || ''} onChange={set('legalName')} />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">Correo de contacto</span>
                <input className="input" value={form.contactEmail || ''} onChange={set('contactEmail')} />
              </label>
              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">Telefono de contacto</span>
                <input className="input" value={form.contactPhone || ''} onChange={set('contactPhone')} />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">Color primario</span>
                <input type="color" className="input h-10" value={form.primaryColor} onChange={set('primaryColor')} />
              </label>
              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">Color secundario</span>
                <input type="color" className="input h-10" value={form.secondaryColor} onChange={set('secondaryColor')} />
              </label>
            </div>
            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Mensaje de bienvenida</span>
              <input className="input" value={form.welcomeMessage || ''} onChange={set('welcomeMessage')} />
            </label>
            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Texto del pie de pagina</span>
              <input className="input" value={form.footerText || ''} onChange={set('footerText')} />
            </label>
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Configuracion de correo (SMTP)</h2>
        <div className="card p-6">
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={emailForm.enabled} onChange={(e) => setEmailForm((f) => ({ ...f, enabled: e.target.checked }))} />
              <span className="font-medium text-gray-700">Habilitar envio de correos</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">Host SMTP</span>
                <input required className="input" value={emailForm.smtpHost} onChange={setEmail('smtpHost')} />
              </label>
              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">Puerto</span>
                <input required type="number" className="input" value={emailForm.smtpPort} onChange={setEmail('smtpPort')} />
              </label>
            </div>
            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Usuario</span>
              <input className="input" value={emailForm.smtpUsername || ''} onChange={setEmail('smtpUsername')} />
            </label>
            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Contrasena (dejar en blanco para no cambiarla)</span>
              <input type="password" className="input" value={emailForm.smtpPassword} onChange={setEmail('smtpPassword')} />
            </label>
            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Correo remitente</span>
              <input className="input" value={emailForm.fromAddress || ''} onChange={setEmail('fromAddress')} />
            </label>
            <button type="submit" disabled={savingEmail} className="btn-primary w-full">
              {savingEmail ? 'Guardando...' : 'Guardar configuracion de correo'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
