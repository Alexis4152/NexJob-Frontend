import { splitBookingRequirements } from '../utils/categoryQuestions'

/** Muestra la descripcion de una contratacion: los requisitos de categoria (Tipo de mueble,
 * Medidas, etc.) como lista, y el texto libre del cliente como parrafo aparte. */
export default function BookingDescription({ description, textClassName = 'text-sm text-gray-700' }) {
  const { requirements, freeText } = splitBookingRequirements(description)
  if (requirements.length === 0 && !freeText) return null

  return (
    <div>
      {requirements.length > 0 && (
        <ul className={`list-disc list-inside space-y-0.5 ${textClassName}`}>
          {requirements.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      )}
      {freeText && (
        <p className={`whitespace-pre-line ${textClassName} ${requirements.length > 0 ? 'mt-2' : ''}`}>{freeText}</p>
      )}
    </div>
  )
}
