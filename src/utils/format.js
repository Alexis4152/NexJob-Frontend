const currencyFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value ?? 0))
}

export function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
}

/** Como formatDate, pero para cuando el valor puede no existir todavia (ej. la fecha de visita
 * de una contratacion "a cotizar", que se acuerda hasta aceptar la cotizacion) en vez de
 * mostrar un espacio en blanco. */
export function formatDateOrTBD(value) {
  return value ? formatDate(value) : 'Por definir'
}

export function formatDateOnly(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('es-MX', { dateStyle: 'medium' })
}

/** Formatea un LocalDate puro (ej. "2026-10-15", sin hora) como "15 de octubre de 2026".
 * Construido con componentes locales (no new Date(string), que interpreta la fecha como UTC y
 * puede mostrar el dia anterior segun el huso horario del visitante). */
export function formatLocalDateEs(isoDate) {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** dd/mm/yyyy, HH:mm */
export function formatDateSlash(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** minutos -> "~X min" / "~X hrs" / "~X dias". null/undefined si no hay dato (no inventa un valor). */
export function formatResponseTime(minutes) {
  if (minutes === null || minutes === undefined) return null
  if (minutes < 60) return `~${Math.max(1, Math.round(minutes))} min`
  const hours = minutes / 60
  if (hours < 24) return `~${Math.round(hours)} hrs`
  return `~${Math.round(hours / 24)} dias`
}
