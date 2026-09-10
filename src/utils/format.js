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
