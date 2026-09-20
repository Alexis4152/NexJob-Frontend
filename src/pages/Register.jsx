import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { welcomeIllustrationSvg } from '../components/WelcomeIllustration'

const welcomeIllustrationUrl = `data:image/svg+xml,${encodeURIComponent(welcomeIllustrationSvg)}`

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'No pudimos crear tu cuenta')
    } finally {
      setLoading(false)
    }
  }

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
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
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Crear cuenta</h1>
            <p className="text-sm text-gray-500 mb-7">Registrate para contratar servicios de confianza.</p>

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

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
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
