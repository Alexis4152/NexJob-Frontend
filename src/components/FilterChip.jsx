export default function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary-50 text-primary-700 pl-3 pr-1.5 py-1 rounded-full">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="leading-none rounded-full hover:bg-primary-100 w-4 h-4 flex items-center justify-center"
        aria-label={`Quitar filtro ${label}`}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </span>
  )
}
