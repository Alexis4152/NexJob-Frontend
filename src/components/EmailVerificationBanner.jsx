import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import EmailVerificationModal from './EmailVerificationModal'

// Solo cliente y prestador ven este aviso -- el admin no tiene un perfil publico que se
// beneficie de un sello de confianza.
const COPY = {
  PROVIDER: 'Este paso es importante para usted para que sus clientes lo visualicen como un prestador de servicios verificado y de confianza.',
  CLIENT: 'Este paso es importante para usted para que su cuenta sea visible como un cliente verificado y le sume confianza a la persona que le brinde sus servicios.',
}

/** Aviso persistente tipo "marca de agua" (esquina superior derecha) mientras el correo no este
 * verificado: nunca bloquea nada, solo invita a verificar y desaparece en cuanto se confirma.
 * Se monta una sola vez en la raiz de la app (ver App.jsx) para que se vea en cualquier pantalla. */
export default function EmailVerificationBanner() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  if (!user || user.emailVerified || !COPY[user.role]) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed top-16 right-3 z-40 max-w-[270px] text-left bg-white/95 backdrop-blur border border-amber-200 rounded-lg shadow-sm px-3 py-2.5 hover:shadow-md transition-shadow"
      >
        <p className="text-xs font-semibold text-gray-700">Hemos identificado que no ha verificado su correo electronico</p>
        <p className="text-[11px] text-gray-500 italic mt-1 leading-snug">{COPY[user.role]}</p>
      </button>

      <EmailVerificationModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
