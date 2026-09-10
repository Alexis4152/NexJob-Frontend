export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button className="btn-secondary text-sm" disabled={page <= 0} onClick={() => onPageChange(page - 1)}>
        ← Anterior
      </button>
      <span className="text-sm text-gray-600">Pagina {page + 1} de {totalPages}</span>
      <button className="btn-secondary text-sm" disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>
        Siguiente →
      </button>
    </div>
  )
}
