import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { validateResetCode, resetPassword } from '../api/auth'

export default function ResetPassword() {
  const location = useLocation()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState(location.state?.email || '')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleValidateCode(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await validateResetCode(email, code)
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.message || 'El codigo no es valido')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden')
      return
    }
    setLoading(true)
    try {
      await resetPassword(email, code, password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.response?.data?.message || 'No pudimos restablecer tu contrasena')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-app py-12 sm:py-20 flex justify-center">
      <div className="w-full max-w-sm card p-6 sm:p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Restablecer contrasena</h1>

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2">
            Tu contrasena fue actualizada. Te llevaremos a iniciar sesion...
          </div>
        ) : step === 1 ? (
          <>
            <p className="text-sm text-gray-500 mb-6">
              Ingresa tu correo y el codigo de 6 letras que te enviamos.
            </p>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
            <form onSubmit={handleValidateCode} className="space-y-4">
              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">Correo electronico</span>
                <input required type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">Codigo</span>
                <input
                  required
                  maxLength={6}
                  className="input uppercase tracking-widest text-center font-mono"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ABCDEF"
                />
              </label>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Validando...' : 'Validar codigo'}
              </button>
            </form>
            <p className="text-sm text-gray-500 mt-4 text-center">
              ¿No tienes un codigo? <Link to="/olvide-password" className="text-primary-700 font-medium hover:underline">Solicitar uno</Link>
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">Elige tu nueva contrasena.</p>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
            <form onSubmit={handleResetPassword} className="space-y-4">
              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">Nueva contrasena</span>
                <input required minLength={8} type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">Confirmar contrasena</span>
                <input required minLength={8} type="password" className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </label>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Guardando...' : 'Restablecer contrasena'}
              </button>
            </form>
          </>
        )}

        <p className="text-sm text-gray-500 mt-6 text-center">
          <Link to="/login" className="text-primary-700 font-medium hover:underline">Volver a iniciar sesion</Link>
        </p>
      </div>
    </div>
  )
}
