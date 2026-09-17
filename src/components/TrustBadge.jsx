/** Insignia del nivel de confianza del prestador (calculado en el backend con datos reales:
 * correo/telefono/identidad verificados, y para el nivel destacado tambien experiencia,
 * resenas, trabajos concluidos y calificacion). No se muestra nada para "BASICO" o sin nivel. */
export default function TrustBadge({ tier }) {
  if (tier === 'DESTACADO') {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full shrink-0 font-medium">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"></path></svg>
        Profesional destacado
      </span>
    )
  }
  if (tier === 'VERIFICADO') {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full shrink-0 font-medium">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
        Verificado
      </span>
    )
  }
  return null
}
