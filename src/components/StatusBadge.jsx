const STATUS_STYLES = {
  SOLICITADO: 'bg-yellow-100 text-yellow-800',
  ACEPTADO: 'bg-blue-100 text-blue-800',
  EN_PROCESO: 'bg-indigo-100 text-indigo-800',
  CONCLUIDO: 'bg-purple-100 text-purple-800',
  APROBADO: 'bg-green-100 text-green-800',
  RECHAZADO: 'bg-red-100 text-red-800',
  CANCELADO: 'bg-gray-200 text-gray-700',
}

const STATUS_LABELS = {
  SOLICITADO: 'Solicitado',
  ACEPTADO: 'Aceptado',
  EN_PROCESO: 'En proceso',
  CONCLUIDO: 'Concluido',
  APROBADO: 'Aprobado y pagado',
  RECHAZADO: 'Rechazado',
  CANCELADO: 'Cancelado',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-700'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}
