import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { adminGetCategory, adminUpdateCategoryIntakeFields } from '../../api/categories'
import { useNotify } from '../../context/NotifyContext'

const TYPE_LABELS = {
  SELECT: 'Seleccion unica',
  MULTISELECT: 'Seleccion multiple',
  NUMBER: 'Numero',
  TEXT: 'Texto corto',
  CHECKBOX: 'Casilla',
  DIMENSIONS: 'Medidas (Largo/Ancho/Alto)',
}
const OPTIONS_TYPES = ['SELECT', 'MULTISELECT']

let tempIdSeq = 0
// Id permanente desde que se crea (no un placeholder "new-X" que luego se reemplaza al
// guardar): asi una pregunta nueva puede referenciar a una casilla/respuesta nueva creada en el
// mismo guardado sin que la referencia se rompa.
function newFieldId() {
  return `field-${Date.now()}-${tempIdSeq++}`
}

// Si un campo es visible ahora mismo en la vista previa, segun sus condiciones (mismo criterio
// que utils/categoryQuestions.js del lado del cliente, pero usando el casing de tipos que
// maneja este editor -- SELECT/CHECKBOX en mayusculas, no select/checkbox).
function isFieldVisibleInPreview(field, allFields, answers) {
  if (field.showIfChecked) return !!answers[field.showIfChecked]
  if (field.showIfFieldId) {
    const trigger = allFields.find((f) => f.id === field.showIfFieldId)
    const val = answers[field.showIfFieldId]
    if (trigger?.type === 'MULTISELECT') return Array.isArray(val) && val.includes(field.showIfValue)
    return val === field.showIfValue
  }
  return true
}

export default function AdminCategoryQuestions() {
  const { id } = useParams()
  const { notify } = useNotify()
  const [category, setCategory] = useState(null)
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  // Respuestas de prueba en la vista previa, solo para poder ver en vivo como se revelan las
  // preguntas condicionales -- no se guarda, es puramente de la vista previa.
  const [previewAnswers, setPreviewAnswers] = useState({})

  useEffect(() => {
    adminGetCategory(id).then((r) => {
      setCategory(r.data.data)
      setFields((r.data.data.intakeFields || []).map((f) => ({
        ...f, options: f.options || [], showIfChecked: f.showIfChecked || '',
        showIfFieldId: f.showIfFieldId || '', showIfValue: f.showIfValue || '',
      })))
    }).finally(() => setLoading(false))
  }, [id])

  function addField() {
    setFields((fs) => [...fs, { id: newFieldId(), label: '', type: 'TEXT', options: [], showIfChecked: '', showIfFieldId: '', showIfValue: '' }])
  }

  function updateField(fieldId, patch) {
    setFields((fs) => fs.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)))
  }

  function setShowIfChecked(fieldId, checkboxId) {
    // Depender de una casilla y de una respuesta especifica a la vez no tiene sentido: elegir
    // una limpia la otra.
    updateField(fieldId, { showIfChecked: checkboxId, showIfFieldId: '', showIfValue: '' })
  }

  function setShowIfFieldId(fieldId, triggerFieldId) {
    updateField(fieldId, { showIfFieldId: triggerFieldId, showIfValue: '', showIfChecked: '' })
  }

  function setShowIfValue(fieldId, value) {
    updateField(fieldId, { showIfValue: value })
  }

  function changeFieldType(fieldId, newType) {
    setFields((fs) => fs
      .map((f) => (f.id === fieldId ? { ...f, type: newType, options: OPTIONS_TYPES.includes(newType) ? f.options : [] } : f))
      // Si deja de ser casilla o de seleccion, las preguntas que dependian de ella vuelven a
      // ser siempre visibles en vez de quedar apuntando a un tipo que ya no aplica.
      .map((f) => (newType !== 'CHECKBOX' && f.showIfChecked === fieldId ? { ...f, showIfChecked: '' } : f))
      .map((f) => (!OPTIONS_TYPES.includes(newType) && f.showIfFieldId === fieldId ? { ...f, showIfFieldId: '', showIfValue: '' } : f)))
  }

  function removeField(fieldId) {
    // Si se borra una casilla o pregunta de la que dependian otras, esas preguntas vuelven a
    // ser siempre visibles en vez de quedar apuntando a algo que ya no existe.
    setFields((fs) => fs
      .filter((f) => f.id !== fieldId)
      .map((f) => (f.showIfChecked === fieldId ? { ...f, showIfChecked: '' } : f))
      .map((f) => (f.showIfFieldId === fieldId ? { ...f, showIfFieldId: '', showIfValue: '' } : f)))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = fields.map((f) => ({
        id: f.id,
        label: f.label,
        type: f.type,
        options: OPTIONS_TYPES.includes(f.type) ? f.options : undefined,
        showIfChecked: f.showIfChecked || undefined,
        showIfFieldId: f.showIfFieldId || undefined,
        showIfValue: f.showIfFieldId ? f.showIfValue || undefined : undefined,
        unit: f.type === 'DIMENSIONS' ? (f.unit || 'cm') : undefined,
      }))
      const res = await adminUpdateCategoryIntakeFields(id, payload)
      setCategory(res.data.data)
      setFields((res.data.data.intakeFields || []).map((f) => ({
        ...f, options: f.options || [], showIfChecked: f.showIfChecked || '',
        showIfFieldId: f.showIfFieldId || '', showIfValue: f.showIfValue || '',
      })))
      notify('Cuestionario actualizado', 'success')
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo guardar el cuestionario', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-gray-500">Cargando...</p>
  if (!category) return <p className="text-gray-500">Categoria no encontrada.</p>

  const checkboxCandidates = (f) => fields.filter((other) => other.type === 'CHECKBOX' && other.id !== f.id && other.label)
  const valueCandidates = (f) => fields.filter((other) => OPTIONS_TYPES.includes(other.type) && other.id !== f.id && other.label && other.options.length > 0)

  return (
    <div>
      <Link to="/admin/categorias" className="text-sm text-primary-700 hover:underline">← Categorias</Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-1">Preguntas de {category.name}</h1>
      <p className="text-sm text-gray-500 mb-6">
        Ademas de su descripcion libre, el cliente respondera estas preguntas al contratar un servicio de esta categoria,
        para que el prestador reciba una ficha clara desde el primer mensaje.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="card p-6">
          {fields.length === 0 && (
            <p className="text-sm text-gray-500 mb-4">Esta categoria todavia no tiene preguntas definidas: el cliente solo vera su descripcion libre.</p>
          )}

          <div className="space-y-3">
            {fields.map((f) => {
              const triggerField = f.showIfFieldId ? fields.find((o) => o.id === f.showIfFieldId) : null
              return (
                <div key={f.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <input
                      className="flex-1 input"
                      placeholder="Texto de la pregunta"
                      value={f.label}
                      onChange={(e) => updateField(f.id, { label: e.target.value })}
                    />
                    <select
                      className="input w-auto shrink-0"
                      value={f.type}
                      onChange={(e) => changeFieldType(f.id, e.target.value)}
                    >
                      {Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    <button type="button" onClick={() => removeField(f.id)} className="text-gray-300 hover:text-red-500 shrink-0 mt-2.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                  {OPTIONS_TYPES.includes(f.type) && (
                    <label className="block text-xs mt-2">
                      <span className="block text-gray-500 mb-1">Opciones (separadas por coma)</span>
                      <input
                        className="input"
                        value={f.options.join(', ')}
                        onChange={(e) => updateField(f.id, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                      />
                    </label>
                  )}
                  {f.type === 'DIMENSIONS' && (
                    <label className="block text-xs mt-2">
                      <span className="block text-gray-500 mb-1">Unidad</span>
                      <select className="input w-auto" value={f.unit || 'cm'} onChange={(e) => updateField(f.id, { unit: e.target.value })}>
                        <option value="cm">Centimetros (muebles, objetos)</option>
                        <option value="m">Metros (habitaciones, fachadas)</option>
                      </select>
                    </label>
                  )}

                  {checkboxCandidates(f).length > 0 && (
                    <label className="block text-xs mt-2">
                      <span className="block text-gray-500 mb-1">Mostrar solo si se marca esta casilla (opcional)</span>
                      <select className="input" value={f.showIfChecked || ''} onChange={(e) => setShowIfChecked(f.id, e.target.value)}>
                        <option value="">Siempre visible</option>
                        {checkboxCandidates(f).map((cb) => <option key={cb.id} value={cb.id}>{cb.label}</option>)}
                      </select>
                    </label>
                  )}

                  {valueCandidates(f).length > 0 && (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className="block text-xs">
                        <span className="block text-gray-500 mb-1">Mostrar solo si esta respuesta es (opcional)</span>
                        <select className="input" value={f.showIfFieldId || ''} onChange={(e) => setShowIfFieldId(f.id, e.target.value)}>
                          <option value="">Siempre visible</option>
                          {valueCandidates(f).map((vf) => <option key={vf.id} value={vf.id}>{vf.label}</option>)}
                        </select>
                      </label>
                      {triggerField && (
                        <label className="block text-xs">
                          <span className="block text-gray-500 mb-1">Valor que la activa</span>
                          <select className="input" value={f.showIfValue || ''} onChange={(e) => setShowIfValue(f.id, e.target.value)}>
                            <option value="">Selecciona un valor</option>
                            {triggerField.options.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </label>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <button type="button" onClick={addField} className="mt-4 text-sm text-primary-700 hover:underline inline-flex items-center gap-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Agregar pregunta
          </button>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <button type="button" onClick={handleSave} disabled={saving} className="btn-primary text-sm">
              {saving ? 'Guardando...' : 'Guardar cuestionario'}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-6">
          <div className="card p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Vista previa — formulario del cliente</h2>
            {fields.filter((f) => f.label).length === 0 ? (
              <p className="text-xs text-gray-400">Sin preguntas: el cliente solo vera su descripcion libre.</p>
            ) : (
              <div className="space-y-3">
                {fields.filter((f) => f.label && !f.showIfChecked && !f.showIfFieldId).map((f) => {
                  const dependents = fields.filter((sf) =>
                    sf.label && (sf.showIfChecked === f.id || sf.showIfFieldId === f.id) && isFieldVisibleInPreview(sf, fields, previewAnswers)
                  )
                  return (
                    <div key={f.id}>
                      <PreviewField
                        field={f}
                        value={previewAnswers[f.id]}
                        onChange={(v) => setPreviewAnswers((a) => ({ ...a, [f.id]: v }))}
                      />
                      {dependents.length > 0 && (
                        <div className="mt-2 pl-3 border-l-2 border-primary-100 space-y-3">
                          {dependents.map((sf) => (
                            <PreviewField key={sf.id} field={sf} value={previewAnswers[sf.id]} onChange={(v) => setPreviewAnswers((a) => ({ ...a, [sf.id]: v }))} />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewField({ field, value, onChange }) {
  if (field.type === 'SELECT') {
    return (
      <label className="block text-xs">
        <span className="block text-gray-600 mb-1">{field.label}</span>
        <select className="input bg-gray-50" value={value || ''} onChange={(e) => onChange?.(e.target.value)}>
          <option value="">Selecciona</option>
          {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>
    )
  }
  if (field.type === 'MULTISELECT') {
    const selected = value || []
    return (
      <div className="text-xs">
        <span className="block text-gray-600 mb-1">{field.label}</span>
        <div className="space-y-1">
          {field.options.map((o) => (
            <label key={o} className="flex items-center gap-1.5 text-gray-600">
              <input
                type="checkbox"
                className="w-3 h-3"
                checked={selected.includes(o)}
                onChange={(e) => onChange?.(e.target.checked ? [...selected, o] : selected.filter((s) => s !== o))}
              />
              {o}
            </label>
          ))}
        </div>
      </div>
    )
  }
  if (field.type === 'CHECKBOX') {
    return (
      <label className="flex items-center gap-2 text-xs text-gray-600">
        <input type="checkbox" className="w-3.5 h-3.5" checked={!!value} onChange={(e) => onChange?.(e.target.checked)} />
        {field.label}
      </label>
    )
  }
  if (field.type === 'DIMENSIONS') {
    return (
      <div className="text-xs">
        <span className="block text-gray-600 mb-1">{field.label} ({field.unit || 'cm'})</span>
        <label className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-1.5">
          <input type="checkbox" className="w-3 h-3" disabled />
          No conozco las medidas exactas
        </label>
        <div className="grid grid-cols-3 gap-1">
          {['Largo', 'Ancho', 'Alto'].map((l) => (
            <input key={l} className="input bg-gray-50" placeholder={l} disabled />
          ))}
        </div>
      </div>
    )
  }
  return (
    <label className="block text-xs">
      <span className="block text-gray-600 mb-1">{field.label}</span>
      <input type={field.type === 'NUMBER' ? 'number' : 'text'} className="input bg-gray-50" placeholder="Respuesta del cliente" disabled />
    </label>
  )
}
