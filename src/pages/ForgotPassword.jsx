import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPassword } from '../api/auth'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await forgotPassword(email)
      navigate('/restablecer-password', { state: { email } })
    } catch (err) {
      setError(err.response?.data?.message || 'No pudimos procesar tu solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-app py-12 sm:py-20 flex justify-center">
      <div className="w-full max-w-sm card p-6 sm:p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Recuperar contrasena</h1>
        <p className="text-sm text-gray-500 mb-6">
          Ingresa tu correo y te enviaremos un codigo de 6 letras para restablecer tu contrasena.
        </p>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="block text-gray-700 mb-1 font-medium">Correo electronico</span>
            <input required type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Enviando...' : 'Enviar codigo'}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-6 text-center">
          <Link to="/login" className="text-primary-700 font-medium hover:underline">Volver a iniciar sesion</Link>
        </p>
      </div>
    </div>
  )
}
