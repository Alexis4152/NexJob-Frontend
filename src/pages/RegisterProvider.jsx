import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listCategories } from '../api/categories'
import { welcomeIllustrationSvg } from '../components/WelcomeIllustration'

const welcomeIllustrationUrl = `data:image/svg+xml,${encodeURIComponent(welcomeIllustrationSvg)}`

export default function RegisterProvider() {
  const { registerProvider } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', categoryId: '', businessName: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { listCategories().then((r) => setCategories(r.data.data)) }, [])

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await registerProvider({ ...form, categoryIds: [Number(form.categoryId)] })
      navigate('/prestador')
    } catch (err) {
      setError(err.response?.data?.message || 'No pudimos crear tu cuenta de prestador')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-app py-12 sm:py-20 flex justify-center">
      <div className="w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden bg-white flex flex-col md:flex-row">
        <div
          className="hidden md:block login-illustration md:h-auto md:w-[380px] shrink-0 bg-[#587189]"
          style={{ backgroundImage: `url("${welcomeIllustrationUrl}")` }}
        />

        <div className="flex-1 p-6 sm:p-10 md:p-12 flex items-center">
          <div className="w-full max-w-sm mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Registrate como prestador</h1>
            <p className="text-sm text-gray-500 mb-7">Publica tus servicios y empieza a recibir contrataciones. Completa el resto de tu perfil despues de iniciar sesion.</p>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
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
                <span className="block text-gray-700 mb-1 font-medium">Correo electrónico</span>
                <input required type="email" className="input" placeholder="correo@gmail.com" value={form.email} onChange={set('email')} />
              </label>

              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">
                  Teléfono <span className="text-gray-400 font-normal">(opcional)</span>
                </span>
                <input className="input" inputMode="numeric" maxLength={10} value={form.phone} onChange={set('phone')} />
              </label>

              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">Contraseña</span>
                <input required minLength={8} type="password" className="input" value={form.password} onChange={set('password')} />
              </label>

              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">¿Qué tipo de servicio ofreces?</span>
                <select required className="input" value={form.categoryId} onChange={set('categoryId')}>
                  <option value="">Selecciona una categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">Nombre de tu negocio u oficio</span>
                <input required className="input" placeholder="Ej. Carpintería Pérez" value={form.businessName} onChange={set('businessName')} />
              </label>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Creando cuenta...' : 'Crear mi cuenta de prestador'}
              </button>
            </form>

            <p className="text-sm text-gray-500 mt-6 text-center">
              ¿Ya tienes cuenta? <Link to="/login" className="text-primary-700 font-medium hover:underline">Inicia sesión</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
