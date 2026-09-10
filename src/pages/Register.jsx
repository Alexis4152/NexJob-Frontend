import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
    <div className="container-app py-12 flex justify-center">
      <div className="w-full max-w-md card p-6 sm:p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Crear cuenta</h1>
        <p className="text-sm text-gray-500 mb-6">Registrate para contratar servicios de confianza.</p>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <input required type="email" className="input" value={form.email} onChange={set('email')} />
          </label>
          <label className="block text-sm">
            <span className="block text-gray-700 mb-1 font-medium">Telefono</span>
            <input className="input" value={form.phone} onChange={set('phone')} />
          </label>
          <label className="block text-sm">
            <span className="block text-gray-700 mb-1 font-medium">Contrasena</span>
            <input required minLength={8} type="password" className="input" value={form.password} onChange={set('password')} />
          </label>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-6 text-center">
          ¿Ya tienes cuenta? <Link to="/login" className="text-primary-700 font-medium hover:underline">Inicia sesion</Link>
        </p>
      </div>
    </div>
  )
}
