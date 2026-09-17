import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { welcomeIllustrationSvg } from '../components/WelcomeIllustration'

const welcomeIllustrationUrl = `data:image/svg+xml,${encodeURIComponent(welcomeIllustrationSvg)}`

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      if (location.state?.from) navigate(location.state.from)
      else if (user.role === 'ADMIN') navigate('/admin')
      else if (user.role === 'PROVIDER') navigate('/prestador')
      else navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'No pudimos iniciar tu sesión')
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
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Iniciar sesión</h1>
            <p className="text-sm text-gray-500 mb-7">Ingresa a tu cuenta para contratar servicios o gestionar tus trabajos.</p>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">Correo electrónico</span>
                <input required type="email" className="input" placeholder="correo@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">Contraseña</span>
                <input required type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
              <div className="text-right -mt-2">
                <Link to="/olvide-password" className="text-sm text-primary-700 hover:underline">¿Olvidaste tu contraseña?</Link>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Ingresando...' : 'Iniciar sesión'}
              </button>
            </form>

            <p className="text-sm text-gray-500 mt-6 text-center">
              ¿No tienes cuenta? <Link to="/registro" className="text-primary-700 font-medium hover:underline">Regístrate</Link>
            </p>
            <p className="text-sm text-gray-500 mt-2 text-center">
              ¿Ofreces un servicio? <Link to="/registro-prestador" className="text-primary-700 font-medium hover:underline">Regístrate como prestador</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
