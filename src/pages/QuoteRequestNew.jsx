import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { listCategories } from '../api/categories'
import { createQuoteRequest } from '../api/quoteRequests'
import { useNotify } from '../context/NotifyContext'

const PAYMENT_METHOD_LABELS = { EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', TRANSFERENCIA: 'Transferencia' }

const URGENCY_OPTIONS = [
  { value: 'URGENTE', label: 'Urgente', description: 'Lo necesito hoy', dot: 'bg-red-500' },
  { value: 'PRONTO', label: 'Pronto', description: 'En los proximos dias', dot: 'bg-yellow-400' },
  { value: 'PROGRAMADO', label: 'Programado', description: 'Puedo esperar', dot: 'bg-green-500' },
]

const STEPS = [
  { title: 'Describe tu necesidad', text: 'Categoria, breve descripcion y tu ubicacion. Un solo formulario.' },
  { title: 'Recibe varias cotizaciones', text: 'Se envia a los prestadores mejor calificados cerca de ti.' },
  { title: 'Compara y elige', text: 'Precio, calificacion y disponibilidad, uno al lado del otro.' },
]

export default function QuoteRequestNew() {
  const navigate = useNavigate()
  const { notify } = useNotify()
  const [categories, setCategories] = useState([])
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    city: '', postalCode: '',
    categoryId: '', description: '', addressLine: '',
    scheduledAt: '', paymentMethod: 'EFECTIVO', urgency: 'PROGRAMADO',
  })

  useEffect(() => {
    listCategories().then((r) => setCategories(r.data.data))
  }, [])

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  const selectedUrgency = URGENCY_OPTIONS.find((o) => o.value === form.urgency)
  const hasPrecisePostalCode = /^\d{5}$/.test(form.postalCode)
  const noCoverageNearby = error.includes('cerca de tu ubicacion')

  function handleContinue(e) {
    e.preventDefault()
    setStep(2)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await createQuoteRequest({ ...form, categoryId: Number(form.categoryId) })
      notify('Solicitud de cotizacion enviada', 'success')
      navigate(`/cotizaciones/${res.data.data.id}`)
    } catch (err) {
      const message = err.response?.data?.message || 'No se pudo enviar la solicitud'
      setError(message)
      notify(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container-app py-8">
      <Link to="/" className="text-sm text-primary-700 hover:underline">← Volver al inicio</Link>

      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Solicitar cotizaciones</h1>
        <p className="text-sm text-gray-600 max-w-2xl">Describe lo que necesitas una vez y recibe precio y disponibilidad de varios prestadores para comparar.</p>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center gap-2">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${step === 1 ? 'bg-primary-600 text-white' : 'bg-primary-100 text-primary-700'}`}>1</span>
          <span className={`text-sm font-medium ${step === 1 ? 'text-gray-900' : 'text-gray-500'}`}>Tu ubicacion</span>
        </div>
        <span className="w-8 sm:w-16 h-px bg-gray-300" />
        <div className="flex items-center gap-2">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${step === 2 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>2</span>
          <span className={`text-sm font-medium ${step === 2 ? 'text-gray-900' : 'text-gray-400'}`}>Detalles del servicio</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
          <p>{error}</p>
          {noCoverageNearby && (
            <Link
              to={form.categoryId ? `/prestadores?categoryId=${form.categoryId}` : '/prestadores'}
              className="inline-block mt-1 font-medium underline hover:no-underline"
            >
              Buscar prestadores sin filtro de ubicacion →
            </Link>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="card p-6 sm:p-8">
            <h2 className="text-base font-bold text-gray-900 mb-1">Donde necesitas el servicio</h2>
            <p className="text-sm text-gray-500 mb-5">Con esto elegimos prestadores realmente cerca de ti, no solo los mejor calificados de cualquier parte del pais.</p>

            <form onSubmit={handleContinue} className="space-y-5">
              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">Ciudad</span>
                <input required className="input" value={form.city} onChange={set('city')} />
              </label>

              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">
                  Codigo postal <span className="text-gray-400 font-normal">(recomendado)</span>
                </span>
                <input
                  className="input"
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="Ej. 76000"
                  value={form.postalCode}
                  onChange={set('postalCode')}
                />
                <span className="block text-xs text-gray-400 mt-1">
                  Con tu codigo postal calculamos la distancia real a cada prestador, igual que en "Encuentra al prestador ideal". Sin el, solo comparamos el nombre de tu ciudad, que es menos preciso.
                </span>
              </label>

              <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${hasPrecisePostalCode ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${hasPrecisePostalCode ? 'bg-green-500' : 'bg-amber-500'}`} />
                {hasPrecisePostalCode ? 'Precision por codigo postal (mas exacta)' : 'Precision por nombre de ciudad'}
              </div>

              <button type="submit" className="btn-primary w-full">Continuar</button>
            </form>
          </div>

          <div className="flex flex-col gap-4 lg:sticky lg:top-20">
            <div className="bg-primary-50 rounded-xl p-5">
              <p className="text-sm font-semibold text-primary-800 mb-1">Por que te lo pedimos</p>
              <p className="text-xs text-primary-800 leading-relaxed">Tu solicitud se envia solo a prestadores que realmente puedan trasladarse hasta ti (dentro de 50 km). Sin tu ubicacion no podemos saber quien esta cerca, y podriamos notificar a alguien de otro estado.</p>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="card p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block text-sm">
                  <span className="block text-gray-700 mb-1 font-medium">Categoria</span>
                  <select required className="input" value={form.categoryId} onChange={set('categoryId')}>
                    <option value="">Selecciona una categoria</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm">
                  <span className="block text-gray-700 mb-1 font-medium">Que tan pronto lo necesitas</span>
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

              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">Cuentanos que necesitas</span>
                <textarea required className="input" rows={3} placeholder="Ej. Necesito pintar mi casa, son 3 recamaras y sala." value={form.description} onChange={set('description')} />
              </label>

              <label className="block text-sm">
                <span className="block text-gray-700 mb-1 font-medium">Direccion de la visita</span>
                <input required className="input" value={form.addressLine} onChange={set('addressLine')} />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block text-sm">
                  <span className="block text-gray-700 mb-1 font-medium">Fecha en la que necesitas el servicio</span>
                  <input required type="datetime-local" className="input" value={form.scheduledAt} onChange={set('scheduledAt')} />
                </label>

                <label className="block text-sm">
                  <span className="block text-gray-700 mb-1 font-medium">Metodo de pago</span>
                  <select className="input" value={form.paymentMethod} onChange={set('paymentMethod')}>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <span className="text-xs text-gray-500 -mt-3 block">La fecha es orientativa: cada prestador te propondra su propia disponibilidad al cotizar.</span>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary">Atras</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Enviando...' : 'Solicitar cotizaciones'}
                </button>
              </div>
            </form>
          </div>

          <div className="flex flex-col gap-4 lg:sticky lg:top-20">
            <div className="bg-primary-50 rounded-xl p-5">
              <p className="text-sm font-semibold text-primary-800 mb-1">Aun no eliges a nadie</p>
              <p className="text-xs text-primary-800 leading-relaxed">Tu solicitud se enviara automaticamente a los prestadores mejor calificados de esta categoria cerca de ti. Tu eliges hasta que veas los precios.</p>
            </div>

            <div className="card p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-3">Tu ubicacion</h2>
              <p className="text-sm text-gray-900">{form.city || 'Sin capturar'}</p>
              <p className="text-xs text-gray-400">{hasPrecisePostalCode ? `C.P. ${form.postalCode}` : 'Sin codigo postal capturado'}</p>
              <button type="button" onClick={() => setStep(1)} className="text-xs text-primary-700 hover:underline mt-2">Editar ubicacion</button>
            </div>

            <div className="card p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-4">Como funciona</h2>
              <div className="flex flex-col gap-4">
                {STEPS.map((s, i) => (
                  <div key={s.title} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                      <p className="text-xs text-gray-500">{s.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
