import { useEffect, useRef, useState } from 'react'
import { sendEmailVerificationCode, verifyEmailCode } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { useNotify } from '../context/NotifyContext'

const CODE_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 60

function maskEmail(email) {
  if (!email) return ''
  const [local, domain] = email.split('@')
  if (!domain) return email
  if (local.length <= 2) return `${local[0]}***@${domain}`
  return `${local[0]}***${local[local.length - 1]}@${domain}`
}

function formatCooldown(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Modal de verificacion de correo (OTP de 6 casillas): se abre desde el perfil o desde el
 * aviso persistente (ver EmailVerificationBanner). Nunca bloquea el uso de la plataforma --
 * el usuario puede cerrarlo o cerrar sesion en cualquier momento sin haber verificado. */
export default function EmailVerificationModal({ open, onClose }) {
  const { user, updateUserInMemory, logout } = useAuth()
  const { notify } = useNotify()
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(''))
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [sending, setSending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const inputRefs = useRef([])

  useEffect(() => {
    if (open) {
      setDigits(Array(CODE_LENGTH).fill(''))
      setError('')
      setInfo('')
      sendCode(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  async function sendCode(isInitial) {
    setSending(true)
    setError('')
    setInfo('')
    try {
      await sendEmailVerificationCode()
      setCooldown(RESEND_COOLDOWN_SECONDS)
      if (!isInitial) notify('Codigo reenviado', 'success')
    } catch (err) {
      const message = err.response?.data?.message || 'No se pudo enviar el codigo'
      // No se cierra el modal por esto: puede que ya haya un codigo vigente de un envio
      // anterior (por ejemplo si se reabre el modal antes de que pase el enfriamiento).
      setInfo(message)
    } finally {
      setSending(false)
    }
  }

  function handleDigitChange(index, value) {
    const clean = value.replace(/\D/g, '')
    if (!clean) {
      const next = [...digits]
      next[index] = ''
      setDigits(next)
      return
    }
    if (clean.length > 1) {
      // Soporta pegar el codigo completo en una sola casilla.
      const next = [...digits]
      clean.split('').slice(0, CODE_LENGTH - index).forEach((ch, i) => { next[index + i] = ch })
      setDigits(next)
      inputRefs.current[Math.min(index + clean.length, CODE_LENGTH) - 1]?.focus()
      return
    }
    const next = [...digits]
    next[index] = clean
    setDigits(next)
    if (index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus()
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  async function handleVerify() {
    const code = digits.join('')
    if (code.length !== CODE_LENGTH) return
    setVerifying(true)
    setError('')
    setInfo('')
    try {
      const res = await verifyEmailCode(code)
      updateUserInMemory(res.data.data)
      notify('Correo verificado', 'success')
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo verificar el codigo')
      setDigits(Array(CODE_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } finally {
      setVerifying(false)
    }
  }

  function handleLogout() {
    logout()
    window.location.href = '/login'
  }

  if (!open) return null

  const allFilled = digits.every((d) => d !== '')

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[110] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center relative">
        <button type="button" onClick={onClose} className="absolute top-3 right-3 text-gray-300 hover:text-gray-500" aria-label="Cerrar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4 text-primary-600">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M22 6l-10 7L2 6"></path></svg>
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-1.5">Verifica tu correo electronico</h2>
        <p className="text-sm text-gray-500 mb-6">
          Enviamos un codigo de {CODE_LENGTH} digitos a <span className="font-semibold text-gray-700">{maskEmail(user?.email)}</span>
        </p>

        <div className="flex justify-center gap-2 mb-4">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              value={d}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              inputMode="numeric"
              maxLength={CODE_LENGTH}
              disabled={verifying}
              className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${error ? 'border-red-400' : 'border-gray-300 focus:border-primary-600'}`}
            />
          ))}
        </div>

        {error && <p className="text-xs text-red-600 font-medium mb-4">{error}</p>}
        {!error && info && <p className="text-xs text-gray-500 mb-4">{info}</p>}

        <button onClick={handleVerify} disabled={!allFilled || verifying} className="btn-primary w-full mb-3">
          {verifying ? 'Verificando...' : 'Verificar codigo'}
        </button>

        <p className="text-xs text-gray-500">
          ¿No te llego?{' '}
          {cooldown > 0 ? (
            <span className="text-gray-400">Reenviar en {formatCooldown(cooldown)}</span>
          ) : (
            <button type="button" onClick={() => sendCode(false)} disabled={sending} className="font-semibold text-primary-700 hover:underline">
              Reenviar codigo
            </button>
          )}
        </p>

        <button type="button" onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600 mt-5 block mx-auto">
          Este correo no es correcto / Cerrar sesion
        </button>
      </div>
    </div>
  )
}
