// Helpers para el cuestionario especifico de categoria en "Contratar servicio": el cliente no
// siempre sabe que datos necesita el prestador (medidas, materiales, zona...), asi que en vez de
// depender solo del texto libre, se piden los datos clave de cada categoria. Las preguntas viven
// como datos en el backend (Category.intakeFields, editables desde Admin > Categorias > Preguntas),
// no hardcodeadas aqui: una categoria sin preguntas definidas simplemente no muestra nada extra.

export const FIELD_TYPE_LABELS = {
  select: 'Seleccion unica',
  multiselect: 'Seleccion multiple',
  number: 'Numero',
  text: 'Texto corto',
  checkbox: 'Casilla',
  dimensions: 'Medidas (Largo/Ancho/Alto)',
}

// Cuando una pregunta de seleccion (unica o multiple) tiene la opcion "Otro" y el cliente la
// marca, se le pide que especifique en un campo de texto aparte (ver BookingNew.jsx); esa
// aclaracion se guarda con esta llave derivada del id del campo, no como una pregunta mas del
// catalogo.
export function otherTextFieldId(fieldId) {
  return `${fieldId}__otro`
}

// Igual que arriba, pero para "no conozco las medidas exactas" en una pregunta de dimensiones
// (ver BookingNew.jsx): muchos clientes no saben calcular Largo/Ancho/Alto de memoria.
export function unknownDimensionsFieldId(fieldId) {
  return `${fieldId}__desconoce`
}

/**
 * Si un campo es visible ahora mismo, segun sus condiciones (ver "Instalacion" en Carpinteria y
 * "cuantas habitaciones" en Pintura):
 * - showIfChecked: visible solo si esa casilla esta marcada.
 * - showIfFieldId/showIfValue: visible solo si la respuesta de ese campo es exactamente ese
 *   valor (o, si ese campo es de seleccion multiple, si ese valor esta entre los marcados).
 * - Sin ninguna de las dos: siempre visible.
 */
export function isFieldVisible(field, fields, answers) {
  if (field.showIfChecked) return !!answers[field.showIfChecked]
  if (field.showIfFieldId) {
    const trigger = fields.find((f) => f.id === field.showIfFieldId)
    const val = answers[field.showIfFieldId]
    if (trigger?.type === 'multiselect') return Array.isArray(val) && val.includes(field.showIfValue)
    return val === field.showIfValue
  }
  return true
}

/** Texto final de una pregunta de dimensiones: null si no aplica (nada capturado y no marco
 * "no conozco las medidas"). */
function formatDimensions(f, answers) {
  if (answers[unknownDimensionsFieldId(f.id)]) return 'No las conoce, solicita visita para medir'
  const d = answers[f.id] || {}
  if (!d.largo && !d.ancho && !d.alto) return null
  const unit = f.unit || 'cm'
  return `${d.largo || '?'} x ${d.ancho || '?'} x ${d.alto || '?'} ${unit}`
}

/** Si eligio "Otro" y aclaro que, combina ambos ("Otro: lo que escribio"); si no aclaro, deja
 * "Otro" tal cual. */
function withOtherSpecified(value, fieldId, answers) {
  if (value !== 'Otro') return value
  const specified = answers[otherTextFieldId(fieldId)]
  return specified ? `Otro: ${specified}` : value
}

function resolveSelectValue(f, answers) {
  const val = answers[f.id]
  return val ? withOtherSpecified(val, f.id, answers) : val
}

/** Como resolveSelectValue, pero para una lista de opciones marcadas: las une con coma. */
function resolveMultiselectValue(f, answers) {
  const selected = answers[f.id]
  if (!Array.isArray(selected) || selected.length === 0) return null
  return selected.map((v) => withOtherSpecified(v, f.id, answers)).join(', ')
}

/** Convierte las respuestas capturadas en lineas de texto legibles para anexar a la descripcion. */
export function formatCategoryAnswers(fields, answers) {
  const lines = []
  fields.forEach((f) => {
    if (!isFieldVisible(f, fields, answers)) return
    if (f.type === 'dimensions') {
      const formatted = formatDimensions(f, answers)
      if (formatted) lines.push(`${f.label}: ${formatted}`)
      return
    }
    if (f.type === 'checkbox') {
      if (answers[f.id]) lines.push(f.label)
      return
    }
    if (f.type === 'multiselect') {
      const val = resolveMultiselectValue(f, answers)
      if (val) lines.push(`${f.label}: ${val}`)
      return
    }
    const val = f.type === 'select' ? resolveSelectValue(f, answers) : answers[f.id]
    if (val) lines.push(`${f.label}: ${val}`)
  })
  return lines
}

/**
 * Separa una descripcion de contratacion (ver BookingNew.jsx) en los requisitos estructurados
 * de la categoria, si los hay, y el texto libre que el cliente escribio aparte -- para poder
 * mostrar los primeros como lista en vez de un parrafo plano. No hay un campo separado en el
 * backend para esto: el bloque de requisitos siempre se guarda primero, con cada linea prefijada
 * "• ", seguido de una linea en blanco y despues el texto libre (ver el join en BookingNew.jsx).
 */
export function splitBookingRequirements(description) {
  if (!description) return { requirements: [], freeText: '' }
  const [first, ...rest] = description.split('\n\n')
  const lines = first.split('\n')
  const isRequirementsBlock = lines.every((l) => l.startsWith('• '))
  if (isRequirementsBlock) {
    return { requirements: lines.map((l) => l.slice(2)), freeText: rest.join('\n\n') }
  }
  return { requirements: [], freeText: description }
}

/** Filas { label, value } para el panel "Asi lo veria el prestador", una por respuesta capturada. */
export function getCategoryAnswerRows(fields, answers) {
  const rows = []
  fields.forEach((f) => {
    if (!isFieldVisible(f, fields, answers)) return
    const label = f.previewLabel || f.label
    if (f.type === 'dimensions') {
      const formatted = formatDimensions(f, answers)
      if (formatted) rows.push({ label, value: formatted })
      return
    }
    if (f.type === 'checkbox') {
      if (answers[f.id]) rows.push({ label, value: 'Si' })
      return
    }
    if (f.type === 'multiselect') {
      const val = resolveMultiselectValue(f, answers)
      if (val) rows.push({ label, value: val })
      return
    }
    const val = f.type === 'select' ? resolveSelectValue(f, answers) : answers[f.id]
    if (val) rows.push({ label, value: val })
  })
  return rows
}
