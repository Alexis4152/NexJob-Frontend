// Los mensajes nativos de validacion de formularios ("Please fill out this field.") los pone
// el navegador en su propio idioma (el de sus preferencias), no el de la pagina — por eso
// aparecen en ingles aunque toda la app este en espanol. La unica forma real de cambiarlos es
// interceptar el evento "invalid" (Constraint Validation API) y ponerles nuestro propio texto.
// Un solo listener global cubre todos los formularios de la app, sin tocar cada <input>.

function messageFor(el) {
  const v = el.validity
  if (v.valueMissing) {
    return el.tagName === 'SELECT' ? 'Por favor selecciona una opcion.' : 'Por favor completa este campo.'
  }
  if (v.typeMismatch) {
    return el.type === 'email' ? 'Por favor incluye un "@" en la direccion de correo.' : 'Por favor ingresa un valor con el formato correcto.'
  }
  if (v.patternMismatch) return 'El formato no es el solicitado.'
  if (v.tooShort) return `Este texto es muy corto. Debe tener al menos ${el.minLength} caracteres.`
  if (v.tooLong) return `Este texto es muy largo. Debe tener como maximo ${el.maxLength} caracteres.`
  if (v.rangeUnderflow) return `El valor debe ser mayor o igual a ${el.min}.`
  if (v.rangeOverflow) return `El valor debe ser menor o igual a ${el.max}.`
  if (v.stepMismatch) return 'Por favor ingresa un valor valido.'
  if (v.badInput) return 'Por favor ingresa un valor valido.'
  return ''
}

function isFormControl(el) {
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Validacion manual para formularios con `noValidate` (ver Register.jsx/RegisterProvider.jsx):
// la burbuja nativa del navegador no siempre respeta el mensaje de setCustomValidity en todos
// los entornos, asi que estos formularios muestran su propio mensaje en espanol (reutilizando
// el mismo banner rojo que ya usan para errores del servidor) en vez de depender de ella.
export function validateRequiredText(value, label) {
  if (!value || !value.trim()) return `${label} es un campo obligatorio.`
  return ''
}

export function validateEmailField(value) {
  if (!value || !value.trim()) return 'El correo electronico es un campo obligatorio.'
  if (!EMAIL_RE.test(value.trim())) return 'Por favor incluye un "@" en la direccion de correo.'
  return ''
}

export function validatePasswordField(value, minLength = 8) {
  if (!value) return 'La contrasena es un campo obligatorio.'
  if (value.length < minLength) return `La contrasena debe tener al menos ${minLength} caracteres.`
  return ''
}

/** Se llama una sola vez al iniciar la app (ver main.jsx). */
export function installSpanishFormValidationMessages() {
  document.addEventListener('invalid', (e) => {
    if (!isFormControl(e.target)) return
    e.target.setCustomValidity(messageFor(e.target))
  }, true)

  // Limpia el mensaje personalizado en cuanto el usuario corrige el campo, para que el
  // navegador vuelva a evaluar la validez real en el siguiente intento de enviar.
  const clear = (e) => { if (isFormControl(e.target)) e.target.setCustomValidity('') }
  document.addEventListener('input', clear, true)
  document.addEventListener('change', clear, true)
}
