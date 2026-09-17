const currencyFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value ?? 0))
}

export function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatDateOnly(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('es-MX', { dateStyle: 'medium' })
}

/** minutos -> "~X min" / "~X hrs" / "~X dias". null/undefined si no hay dato (no inventa un valor). */
export function formatResponseTime(minutes) {
  if (minutes === null || minutes === undefined) return null
  if (minutes < 60) return `~${Math.max(1, Math.round(minutes))} min`
  const hours = minutes / 60
  if (hours < 24) return `~${Math.round(hours)} hrs`
  return `~${Math.round(hours / 24)} dias`
}
