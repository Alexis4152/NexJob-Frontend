/** Estrellas de calificacion, ya sea de solo lectura (catalogo/resenas) o interactivas (formulario de resena). */
export default function RatingStars({ value = 0, onChange, size = 'text-base' }) {
  const rounded = Math.round(Number(value) || 0)
  const stars = [1, 2, 3, 4, 5]

  return (
    <div className={`flex items-center gap-0.5 ${size}`}>
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          className={`leading-none ${onChange ? 'cursor-pointer' : 'cursor-default'} ${star <= rounded ? 'text-amber-400' : 'text-gray-300'}`}
          aria-label={`${star} estrellas`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
