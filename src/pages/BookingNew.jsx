import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getPublicService, getProviderBusySlots } from '../api/providers'
import { createBooking, uploadBookingReferenceImage } from '../api/bookings'
import { formatCurrency } from '../utils/format'
import { useNotify } from '../context/NotifyContext'
import { SERVICE_DAYS_LABELS, SERVICE_HOURS_LABELS } from '../utils/providerSchedule'
import { formatCategoryAnswers, getCategoryAnswerRows, otherTextFieldId, unknownDimensionsFieldId, isFieldVisible } from '../utils/categoryQuestions'
import FurnitureScaleDrawing from '../components/FurnitureScaleDrawing'

const PRICE_TYPE_LABELS = { FIJO: 'precio fijo', POR_HORA: 'por hora', COTIZACION: 'a cotizar' }
const PAYMENT_METHOD_LABELS = { EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', TRANSFERENCIA: 'Transferencia' }

const URGENCY_OPTIONS = [
  { value: 'URGENTE', label: 'Urgente', description: 'Lo necesito hoy', dot: 'bg-red-500' },
  { value: 'PRONTO', label: 'Pronto', description: 'En los proximos dias', dot: 'bg-yellow-400' },
  { value: 'PROGRAMADO', label: 'Programado', description: 'Puedo esperar', dot: 'bg-green-500' },
]

function pad(n) {
  return String(n).padStart(2, '0')
}

function toLocalIso(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export default function BookingNew() {
  const { serviceId } = useParams()
  const navigate = useNavigate()
  const { notify } = useNotify()
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ description: '', addressLine: '', city: '', scheduledAt: '', paymentMethod: 'EFECTIVO', urgency: 'PROGRAMADO' })
  const [categoryAnswers, setCategoryAnswers] = useState({})
  const [referenceFile, setReferenceFile] = useState(null)
  const [referencePreviewUrl, setReferencePreviewUrl] = useState('')
  const [error, setError] = useState('')
  const [busySlots, setBusySlots] = useState([])

  useEffect(() => {
    getPublicService(serviceId).then((r) => setService(r.data.data)).finally(() => setLoading(false))
  }, [serviceId])

  useEffect(() => () => { if (referencePreviewUrl) URL.revokeObjectURL(referencePreviewUrl) }, [referencePreviewUrl])

  useEffect(() => {
    if (!service?.providerId) return
    const now = new Date()
    const in60Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 60, 23, 59, 59)
    getProviderBusySlots(service.providerId, { from: toLocalIso(now), to: toLocalIso(in60Days) })
      .then((r) => setBusySlots(r.data.data))
  }, [service?.providerId])

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  // Si cambiar una respuesta hace que un grupo de preguntas condicionales (ver "showIfChecked"/
  // "showIfFieldId" en Carpinteria e "Pintura") deje de aplicar, se borran esas respuestas: si
  // el cliente ya no necesita ese apartado, no debe quedar informacion vieja escondida que se
  // cuele en la solicitud.
  function setAnswer(fieldId, value) {
    setCategoryAnswers((a) => {
      const next = { ...a, [fieldId]: value }
      categoryFields.forEach((other) => {
        if ((other.showIfChecked === fieldId || other.showIfFieldId === fieldId) && !isFieldVisible(other, categoryFields, next)) {
          delete next[other.id]
        }
      })
      return next
    })
  }

  // Guardadas por id de campo (no en una sola llave "dimensions" compartida), para que dos
  // preguntas de medidas en la misma categoria no se pisen entre si.
  function setDimension(fieldId, key, value) {
    setCategoryAnswers((a) => ({ ...a, [fieldId]: { ...a[fieldId], [key]: value } }))
  }

  function toggleMultiselectOption(fieldId, option) {
    const current = categoryAnswers[fieldId] || []
    const next = current.includes(option) ? current.filter((o) => o !== option) : [...current, option]
    setAnswer(fieldId, next)
  }

  function renderCategoryField(f) {
    if (f.type === 'select') {
      return (
        <label className="block text-sm">
          <span className="block text-gray-700 mb-1 font-medium">{f.label}</span>
          <select className="input" value={categoryAnswers[f.id] || ''} onChange={(e) => setAnswer(f.id, e.target.value)}>
            <option value="">Selecciona</option>
            {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          {categoryAnswers[f.id] === 'Otro' && (
            <input
              className="input mt-2"
              placeholder="Especifica que necesitas"
              value={categoryAnswers[otherTextFieldId(f.id)] || ''}
              onChange={(e) => setAnswer(otherTextFieldId(f.id), e.target.value)}
            />
          )}
        </label>
      )
    }
    if (f.type === 'checkbox') {
      return (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="w-4 h-4" checked={!!categoryAnswers[f.id]} onChange={(e) => setAnswer(f.id, e.target.checked)} />
          <span className="text-gray-700">{f.label}</span>
        </label>
      )
    }
    if (f.type === 'multiselect') {
      const selected = categoryAnswers[f.id] || []
      return (
        <div className="text-sm">
          <span className="block text-gray-700 mb-2 font-medium">{f.label}</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {f.options.map((o) => (
              <label key={o} className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="w-4 h-4" checked={selected.includes(o)} onChange={() => toggleMultiselectOption(f.id, o)} />
                <span className="text-gray-700">{o}</span>
              </label>
            ))}
          </div>
          {selected.includes('Otro') && (
            <input
              className="input mt-2"
              placeholder="Especifica que necesitas"
              value={categoryAnswers[otherTextFieldId(f.id)] || ''}
              onChange={(e) => setAnswer(otherTextFieldId(f.id), e.target.value)}
            />
          )}
        </div>
      )
    }
    if (f.type === 'dimensions') {
      const unit = f.unit || 'cm'
      const placeholders = unit === 'm' ? { largo: '5', ancho: '4', alto: '2.8' } : { largo: '180', ancho: '90', alto: '75' }
      const unknown = !!categoryAnswers[unknownDimensionsFieldId(f.id)]
      const dims = categoryAnswers[f.id] || {}
      return (
        <div className="text-sm">
          <span className="block text-gray-700 mb-1 font-medium">{f.label} ({unit})</span>

          <label className="flex items-center gap-2 text-xs text-gray-600 mb-2">
            <input
              type="checkbox"
              className="w-3.5 h-3.5"
              checked={unknown}
              onChange={(e) => setAnswer(unknownDimensionsFieldId(f.id), e.target.checked)}
            />
            No conozco las medidas exactas
          </label>

          {unknown ? (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 flex gap-2 items-start">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><rect x="2" y="8" width="20" height="8" rx="1"></rect><path d="M6 8v8M10 8v4M14 8v4M18 8v8"></path></svg>
              <span className="text-xs text-blue-800 leading-relaxed">
                Sin problema. Le avisaremos al prestador que necesitas que revise en sitio o te ayude a estimar las medidas antes de cotizar.
              </span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <label className="block text-xs">
                  <span className="block text-gray-500 mb-1">Largo</span>
                  <input type="number" min="0" step="0.01" placeholder={`Ej. ${placeholders.largo}`} className="input" value={dims.largo || ''} onChange={(e) => setDimension(f.id, 'largo', e.target.value)} />
                </label>
                <label className="block text-xs">
                  <span className="block text-gray-500 mb-1">Ancho</span>
                  <input type="number" min="0" step="0.01" placeholder={`Ej. ${placeholders.ancho}`} className="input" value={dims.ancho || ''} onChange={(e) => setDimension(f.id, 'ancho', e.target.value)} />
                </label>
                <label className="block text-xs">
                  <span className="block text-gray-500 mb-1">Alto</span>
                  <input type="number" min="0" step="0.01" placeholder={`Ej. ${placeholders.alto}`} className="input" value={dims.alto || ''} onChange={(e) => setDimension(f.id, 'alto', e.target.value)} />
                </label>
              </div>
              <span className="block text-xs text-gray-400 mt-1">Si no las sabes con exactitud, danos un aproximado — el prestador las confirma en la visita.</span>
              {unit === 'cm' && (dims.largo || dims.alto) && (
                <div className="mt-3 bg-gray-50 border border-gray-100 rounded-lg p-3">
                  <FurnitureScaleDrawing lengthCm={dims.largo} heightCm={dims.alto} />
                </div>
              )}
            </>
          )}
        </div>
      )
    }
    return (
      <label className="block text-sm">
        <span className="block text-gray-700 mb-1 font-medium">{f.label}</span>
        <input
          type={f.type === 'number' ? 'number' : 'text'}
          min={f.type === 'number' ? '0' : undefined}
          className="input"
          placeholder={f.placeholder}
          value={categoryAnswers[f.id] || ''}
          onChange={(e) => setAnswer(f.id, e.target.value)}
        />
      </label>
    )
  }

  function handleSelectReferenceFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setReferenceFile(file)
    setReferencePreviewUrl(URL.createObjectURL(file))
  }

  function handleRemoveReferenceFile() {
    setReferenceFile(null)
    setReferencePreviewUrl('')
  }

  // Un servicio "a cotizar" no tiene visita que agendar todavia: el prestador normalmente
  // fabrica/prepara el trabajo y solo visita al cliente para entregar/instalar una vez que se
  // acepta la cotizacion, asi que no se piden direccion ni fecha en la solicitud inicial.
  const isCotizacion = service?.priceType === 'COTIZACION'
  const isSlotTaken = !isCotizacion && form.scheduledAt !== '' && busySlots.some((s) => s.slice(0, 16) === form.scheduledAt)
  const selectedUrgency = URGENCY_OPTIONS.find((o) => o.value === form.urgency)
  // El tipo llega en mayusculas desde el backend (nombre del enum Java); se normaliza aqui
  // una sola vez para que el resto del componente siga comparando en minusculas.
  const categoryFields = (service?.categoryIntakeFields || []).map((f) => ({ ...f, type: f.type.toLowerCase() }))
  const categoryAnswerRows = getCategoryAnswerRows(categoryFields, categoryAnswers)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (isSlotTaken) {
      const message = 'El prestador ya tiene una visita agendada en esa fecha y hora. Elige otro horario.'
      setError(message)
      notify(message, 'error')
      return
    }
    setSubmitting(true)
    try {
      const structuredLines = formatCategoryAnswers(categoryFields, categoryAnswers)
      const requirementsBlock = structuredLines.map((l) => `• ${l}`).join('\n')
      const description = [requirementsBlock, form.description].filter(Boolean).join('\n\n')
      const payload = {
        serviceId: Number(serviceId),
        ...form,
        description,
        addressLine: isCotizacion ? null : form.addressLine,
        city: isCotizacion ? null : form.city,
        scheduledAt: isCotizacion ? null : form.scheduledAt,
      }
      const res = await createBooking(payload)
      if (referenceFile) {
        try {
          await uploadBookingReferenceImage(res.data.data.id, referenceFile)
        } catch (imgErr) {
          notify(imgErr.response?.data?.message || 'La solicitud se envio, pero no se pudo subir la foto de referencia', 'error')
        }
      }
      notify('Solicitud enviada al prestador', 'success')
      navigate(`/mis-contrataciones/${res.data.data.id}`)
    } catch (err) {
      const message = err.response?.data?.message || 'No se pudo enviar la solicitud'
      setError(message)
      notify(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="container-app py-12 text-gray-500">Cargando...</div>
  if (!service) return <div className="container-app py-12 text-gray-500">Servicio no encontrado.</div>

  return (
    <div className="container-app py-8">
      <Link to={`/prestadores/${service.providerId}`} className="text-sm text-primary-700 hover:underline">← Volver al perfil</Link>

      <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-6">Contratar servicio</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="card p-6 sm:p-8">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            {categoryFields.length > 0 && (
              <div className="space-y-4 pb-5 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">Detalles para tu solicitud</h2>
                {categoryFields.filter((f) => !f.showIfChecked && !f.showIfFieldId).map((f) => {
                  const dependents = categoryFields.filter((sf) =>
                    (sf.showIfChecked === f.id || sf.showIfFieldId === f.id) && isFieldVisible(sf, categoryFields, categoryAnswers)
                  )
                  return (
                    <div key={f.id}>
                      {renderCategoryField(f)}
                      {dependents.length > 0 && (
                        <div className="mt-3 pl-4 border-l-2 border-primary-100 space-y-4">
                          {dependents.map((sf) => <div key={sf.id}>{renderCategoryField(sf)}</div>)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">
                {categoryFields.length > 0 ? 'Algo mas que quieras contarle al prestador (opcional)' : 'Describe lo que necesitas'}
              </span>
              <textarea
                className="input"
                rows={3}
                placeholder={categoryFields.length > 0 ? 'Ej. Cualquier otro detalle que el prestador deba saber.' : 'Ej. Describe el trabajo que necesitas y cualquier detalle importante.'}
                value={form.description}
                onChange={set('description')}
              />
            </label>

            <label className="block text-sm">
              <span className="block text-gray-700 mb-2 font-medium">
                Foto de referencia <span className="text-gray-400 font-normal">(opcional)</span>
              </span>
              {referencePreviewUrl ? (
                <div className="relative inline-block">
                  <img src={referencePreviewUrl} alt="" className="h-24 w-24 object-cover rounded-lg border border-gray-200" />
                  <button type="button" onClick={handleRemoveReferenceFile} className="absolute -top-2 -right-2 bg-black/60 text-white rounded-full w-5 h-5 text-xs leading-none">✕</button>
                </div>
              ) : (
                <label className="block border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-xs text-gray-400 hover:border-primary-400 cursor-pointer">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-1 text-gray-300"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                  Sube una foto (ej. el espacio, objeto o problema que quieres resolver)
                  <input type="file" accept="image/*" className="hidden" onChange={handleSelectReferenceFile} />
                </label>
              )}
            </label>

            {isCotizacion ? (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2.5 flex gap-2 items-start">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span className="text-xs text-gray-500 leading-relaxed">
                  Este servicio es "a cotizar": la direccion y la fecha de la visita se acuerdan con el prestador hasta que aceptes su cotizacion, no ahora.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block text-sm">
                  <span className="block text-gray-700 mb-1 font-medium">Direccion de la visita</span>
                  <input required className="input" placeholder="Ej. Av. Insurgentes Sur 1234, Col. Del Valle" value={form.addressLine} onChange={set('addressLine')} />
                </label>
                <label className="block text-sm">
                  <span className="block text-gray-700 mb-1 font-medium">Ciudad</span>
                  <input required className="input" placeholder="Ej. Ciudad de Mexico" value={form.city} onChange={set('city')} />
                </label>
              </div>
            )}

            <div className={`grid grid-cols-1 ${isCotizacion ? '' : 'sm:grid-cols-2'} gap-4`}>
              {!isCotizacion && (
                <label className="block text-sm">
                  <span className="block text-gray-700 mb-1 font-medium">Fecha y hora de la visita</span>
                  <input required type="datetime-local" lang="es-MX" className={`input ${isSlotTaken ? 'border-red-400' : ''}`} value={form.scheduledAt} onChange={set('scheduledAt')} />
                  {isSlotTaken && (
                    <span className="text-xs text-red-600 mt-1 block">Este horario ya esta apartado con el prestador. Elige otro.</span>
                  )}
                </label>
              )}

              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">¿Que tan pronto lo necesitas?</span>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full pointer-events-none ${selectedUrgency.dot}`} />
                  <select className="input pl-8" value={form.urgency} onChange={set('urgency')}>
                    {URGENCY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label} — {opt.description}</option>
                    ))}
                  </select>
                </div>
              </label>
            </div>

            <div>
              <span className="block text-gray-700 mb-2 text-sm font-medium">Metodo de pago</span>
              <div className="flex gap-3">
                {['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'].map((m) => (
                  <label key={m} className={`flex-1 border rounded-lg px-3 py-2 text-sm text-center cursor-pointer ${form.paymentMethod === m ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-600'}`}>
                    <input type="radio" name="paymentMethod" value={m} checked={form.paymentMethod === m} onChange={set('paymentMethod')} className="hidden" />
                    {PAYMENT_METHOD_LABELS[m]}
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {form.paymentMethod === 'TRANSFERENCIA'
                  ? 'Al validar el servicio deberas adjuntar una foto del comprobante de transferencia.'
                  : 'El pago se libera hasta que valides que el servicio quedo bien.'}
              </p>
            </div>

            <button type="submit" disabled={submitting || isSlotTaken} className="btn-primary w-full">
              {submitting ? 'Enviando...' : 'Solicitar contratacion'}
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-20">
          <div className="card p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Servicio</h2>
            <p className="font-semibold text-gray-900 mb-0.5">{service.title}</p>
            <p className="text-sm text-gray-500 mb-3">{service.providerBusinessName}</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(service.price)} <span className="text-xs font-normal text-gray-500">({PRICE_TYPE_LABELS[service.priceType]})</span>
            </p>
            {(service.providerServiceDays || service.providerServiceHours) && (
              <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                {service.providerServiceDays && (
                  <span className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    {SERVICE_DAYS_LABELS[service.providerServiceDays]}
                  </span>
                )}
                {service.providerServiceHours && (
                  <span className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    {SERVICE_HOURS_LABELS[service.providerServiceHours]}
                  </span>
                )}
              </div>
            )}
          </div>

          {categoryFields.length > 0 && (
            <div className="card p-5">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Asi lo veria el prestador</h2>
              {categoryAnswerRows.length === 0 ? (
                <p className="text-xs text-gray-400">Llena los detalles de arriba para ver la ficha.</p>
              ) : (
                <div className="text-sm">
                  {categoryAnswerRows.map((r) => (
                    <div key={r.label} className="py-1.5 border-b border-gray-50 last:border-0">
                      <p className="text-gray-400 text-xs mb-0.5">{r.label}</p>
                      <p className="text-gray-900 font-medium">{r.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isCotizacion && busySlots.length > 0 && (
            <details className="card p-4 text-xs text-gray-500">
              <summary className="cursor-pointer hover:text-gray-700 font-medium text-gray-700">Horarios ya ocupados con este prestador</summary>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                {busySlots.slice(0, 15).map((s) => (
                  <li key={s}>{new Date(s).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</li>
                ))}
              </ul>
            </details>
          )}

          <div className="bg-primary-50 rounded-xl p-5">
            <p className="text-xs text-primary-800 leading-relaxed">Pago protegido: se libera hasta que apruebes que el trabajo quedo bien.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
