export default function AdminPagination({ page, size, totalPages, totalElements, contentLength, onPageChange, onSizeChange }) {
  if (totalElements === 0) return null

  const start = page * size + 1
  const end = page * size + contentLength

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 text-sm text-gray-600">
      <span>Mostrando {start}-{end} de {totalElements}</span>
      <div className="flex items-center gap-3">
        {onSizeChange && (
          <select className="input !w-auto text-sm" value={size} onChange={(e) => onSizeChange(Number(e.target.value))}>
            {[10, 20, 50].map((s) => <option key={s} value={s}>{s} / pagina</option>)}
          </select>
        )}
        <div className="flex gap-2">
          <button className="btn-secondary text-sm" disabled={page <= 0} onClick={() => onPageChange(page - 1)}>←</button>
          <span className="px-2 py-2">{page + 1} / {Math.max(totalPages, 1)}</span>
          <button className="btn-secondary text-sm" disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>→</button>
        </div>
      </div>
    </div>
  )
}
