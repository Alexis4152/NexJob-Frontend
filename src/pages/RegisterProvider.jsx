import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listCategories } from '../api/categories'

export default function RegisterProvider() {
  const { registerProvider } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '',
    businessName: '', bio: '', yearsExperience: '', city: '', categoryIds: [],
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { listCategories().then((r) => setCategories(r.data.data)) }, [])

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function toggleCategory(id) {
    setForm((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(id) ? f.categoryIds.filter((c) => c !== id) : [...f.categoryIds, id],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.categoryIds.length === 0) {
      setError('Selecciona al menos una categoria de servicio')
      return
    }
    setLoading(true)
    try {
      await registerProvider({ ...form, yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : null })
      navigate('/prestador')
    } catch (err) {
      setError(err.response?.data?.message || 'No pudimos crear tu cuenta de prestador')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-app py-12 flex justify-center">
      <div className="w-full max-w-xl card p-6 sm:p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Registrate como prestador de servicio</h1>
        <p className="text-sm text-gray-500 mb-6">Publica tus servicios y empieza a recibir contrataciones de clientes cerca de ti.</p>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Correo electronico</span>
              <input required type="email" className="input" value={form.email} onChange={set('email')} />
            </label>
            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Telefono</span>
              <input className="input" value={form.phone} onChange={set('phone')} />
            </label>
          </div>
          <label className="block text-sm">
            <span className="block text-gray-700 mb-1 font-medium">Contrasena</span>
            <input required minLength={8} type="password" className="input" value={form.password} onChange={set('password')} />
          </label>

          <hr className="border-gray-100" />

          <label className="block text-sm">
            <span className="block text-gray-700 mb-1 font-medium">Nombre de tu negocio u oficio</span>
            <input required className="input" placeholder="Ej. Carpinteria Perez" value={form.businessName} onChange={set('businessName')} />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Ciudad donde trabajas</span>
              <input required className="input" value={form.city} onChange={set('city')} />
            </label>
            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Anos de experiencia</span>
              <input type="number" min={0} className="input" value={form.yearsExperience} onChange={set('yearsExperience')} />
            </label>
          </div>
          <label className="block text-sm">
            <span className="block text-gray-700 mb-1 font-medium">Cuentanos sobre tu trabajo</span>
            <textarea className="input" rows={3} value={form.bio} onChange={set('bio')} />
          </label>

          <div>
            <span className="block text-gray-700 mb-2 text-sm font-medium">Categorias de servicio que ofreces</span>
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

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creando cuenta...' : 'Crear mi cuenta de prestador'}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-6 text-center">
          ¿Ya tienes cuenta? <Link to="/login" className="text-primary-700 font-medium hover:underline">Inicia sesion</Link>
        </p>
      </div>
    </div>
  )
}
