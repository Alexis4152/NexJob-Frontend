import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listCategories, getServiceTypes } from '../api/categories'
import { searchProviders } from '../api/providers'
import ProviderCard from '../components/ProviderCard'
import FilterChip from '../components/FilterChip'
import Pagination from '../components/Pagination'
import { formatCurrency } from '../utils/format'

const PRICE_RANGES = [
  { id: '50-100', label: '$50 - $100', min: 50, max: 100 },
  { id: '100-200', label: '$100 - $200', min: 100, max: 200 },
  { id: '200-300', label: '$200 - $300', min: 200, max: 300 },
  { id: '300-500', label: '$300 - $500', min: 300, max: 500 },
  { id: '500+', label: '$500+', min: 500, max: null },
]
const DISTANCE_MIN = 1
const DISTANCE_MAX = 50
const EXAMPLE_TEXT = 'Tengo una fuga de agua debajo del fregadero, necesito un plomero'

// Palabras clave -> slug de categoria real (ver db/02_seed.sql). Solo se usa para
// sugerir, nunca para filtrar directamente: el usuario siempre confirma.
const KEYWORD_MAP = {
  plomeria: /fuga|tuber|drenaje|ca[nñ]o|plomer|hidraulic/i,
  electricidad: /luz|corto ?circuito|cable|enchufe|el[eé]ctric|apag[oó]n/i,
  'limpieza-del-hogar': /limpi|aseo/i,
  jardineria: /jard[ií]n|pasto|planta|poda/i,
  pintura: /pintur|pintar|pared/i,
  carpinteria: /carpint|mueble|closet|madera/i,
  albanileria: /alba[ñn]il|construccion|remodelacion|tabique/i,
  cerrajeria: /cerraj|cerradura|llave/i,
  'aire-acondicionado': /aire acond|climatizacion|refrigeracion/i,
  'mudanzas-y-fletes': /mudanza|flete/i,
  'belleza-y-estetica': /peluquer|manicure|estetica/i,
  'tecnologia-y-soporte': /soporte tecnico|computadora|red wifi|internet/i,
  'clases-particulares': /clases particulares|asesoria|tutor/i,
  'mecanica-automotriz': /mecanic|motocicleta/i,
  'fotografia-y-video': /fotografia|video de evento/i,
}

function isPositiveInt(value) {
  return /^[1-9][0-9]*$/.test(String(value).trim())
}

function detectCategory(text, categories) {
  if (!text || text.trim().length < 4) return null
  const t = text.toLowerCase()
  for (const [slug, regex] of Object.entries(KEYWORD_MAP)) {
    if (regex.test(t)) {
      const match = categories.find((c) => c.slug === slug)
      if (match) return match
    }
  }
  return null
}

const emptyResult = { content: [], totalPages: 0 }

export default function Providers() {
  const [params, setParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [filters, setFilters] = useState({
    q: params.get('q') || '',
    categoryId: params.get('categoryId') || '',
    city: params.get('city') || '',
    sort: params.get('sort') || 'recomendados',
    minRating: 0,
    verified: false,
    minExperience: 0,
    minPrice: null,
    maxPrice: null,
    hasPhotos: false,
    availability: '',
    customDate: '',
    serviceType: '',
    lat: null,
    lng: null,
    maxDistanceKm: DISTANCE_MAX,
  })
  const [page, setPage] = useState(0)
  const [result, setResult] = useState(emptyResult)
  const [loading, setLoading] = useState(true)
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false)
  const [suggestionDismissed, setSuggestionDismissed] = useState(false)
  const [suggestionApplied, setSuggestionApplied] = useState(false)
  const [similar, setSimilar] = useState([])
  const [serviceTypes, setServiceTypes] = useState([])
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [priceMode, setPriceMode] = useState(null)
  const [otroMin, setOtroMin] = useState('')
  const [otroMax, setOtroMax] = useState('')

  useEffect(() => { listCategories().then((r) => setCategories(r.data.data)) }, [])

  useEffect(() => {
    if (priceMode !== 'otro') return
    const min = parseInt(otroMin, 10)
    const max = parseInt(otroMax, 10)
    if (Number.isInteger(min) && min > 0 && Number.isInteger(max) && max > min) {
      handleFilterChange({ minPrice: min, maxPrice: max })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceMode, otroMin, otroMax])

  useEffect(() => {
    if (filters.categoryId) {
      getServiceTypes(filters.categoryId).then((r) => setServiceTypes(r.data.data))
    } else {
      setServiceTypes([])
    }
  }, [filters.categoryId])

  useEffect(() => {
    setLoading(true)
    searchProviders({
      q: filters.q || undefined,
      categoryId: filters.categoryId || undefined,
      city: filters.city || undefined,
      minRating: filters.minRating > 0 ? filters.minRating : undefined,
      verified: filters.verified ? true : undefined,
      minExperience: filters.minExperience > 0 ? filters.minExperience : undefined,
      minPrice: filters.minPrice ?? undefined,
      maxPrice: filters.maxPrice ?? undefined,
      hasPhotos: filters.hasPhotos ? true : undefined,
      availability: filters.availability || undefined,
      date: (filters.availability === 'fecha' && filters.customDate) ? filters.customDate : undefined,
      serviceType: filters.serviceType || undefined,
      lat: filters.lat ?? undefined,
      lng: filters.lng ?? undefined,
      maxDistanceKm: (filters.lat && filters.maxDistanceKm < DISTANCE_MAX) ? filters.maxDistanceKm : undefined,
      sort: filters.sort,
      page, size: 9,
    }).then((r) => setResult(r.data.data)).finally(() => setLoading(false))
  }, [page, filters])

  useEffect(() => {
    const noResults = !loading && result.content.length === 0
    if (noResults && filters.categoryId) {
      searchProviders({ categoryId: filters.categoryId, sort: 'recomendados', page: 0, size: 3 })
        .then((r) => setSimilar(r.data.data.content))
    } else {
      setSimilar([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, result, filters.categoryId])

  function handleFilterChange(patch) {
    setPage(0)
    setFilters((f) => {
      const next = { ...f, ...patch }
      setParams({
        ...(next.q && { q: next.q }),
        ...(next.categoryId && { categoryId: next.categoryId }),
        ...(next.city && { city: next.city }),
        ...(next.sort && { sort: next.sort }),
      })
      return next
    })
  }

  function handleSearchChange(e) {
    setSuggestionDismissed(false)
    setSuggestionApplied(false)
    handleFilterChange({ q: e.target.value })
  }

  function clearAll() {
    setPriceMode(null)
    setOtroMin('')
    setOtroMax('')
    handleFilterChange({
      categoryId: '', city: '', minRating: 0, verified: false,
      minExperience: 0, minPrice: null, maxPrice: null, hasPhotos: false, availability: '', customDate: '',
      serviceType: '', lat: null, lng: null, maxDistanceKm: DISTANCE_MAX, sort: 'recomendados',
    })
  }

  function clearPrice() {
    setPriceMode(null)
    setOtroMin('')
    setOtroMax('')
    handleFilterChange({ minPrice: null, maxPrice: null })
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no soporta geolocalización.')
      return
    }
    setLocationError('')
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationLoading(false)
        handleFilterChange({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        setLocationLoading(false)
        setLocationError('No pudimos obtener tu ubicación. Revisa los permisos del navegador.')
      },
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }

  function disableLocation() {
    handleFilterChange({ lat: null, lng: null, maxDistanceKm: DISTANCE_MAX, sort: filters.sort === 'cercanos' ? 'recomendados' : filters.sort })
  }

  const AVAILABILITY_LABELS = { hoy: 'Hoy', manana: 'Mañana', semana: 'Esta semana' }

  const detected = detectCategory(filters.q, categories)
  const showSuggestion = !!detected && !suggestionDismissed && !suggestionApplied && filters.categoryId !== String(detected.id)

  function applySuggestion() {
    handleFilterChange({ categoryId: String(detected.id) })
    setSuggestionApplied(true)
  }

  const selectedCategory = categories.find((c) => String(c.id) === filters.categoryId)
  const matchedPriceRange = PRICE_RANGES.find((r) => r.min === filters.minPrice && r.max === filters.maxPrice)
  const priceSelectValue = priceMode === 'otro' ? 'otro' : (matchedPriceRange ? matchedPriceRange.id : '')

  const chips = []
  if (selectedCategory) chips.push({ label: `${selectedCategory.icon} ${selectedCategory.name}`, remove: () => handleFilterChange({ categoryId: '', serviceType: '' }) })
  if (filters.serviceType) chips.push({ label: filters.serviceType, remove: () => handleFilterChange({ serviceType: '' }) })
  if (filters.city) chips.push({ label: `Ubicación: ${filters.city}`, remove: () => handleFilterChange({ city: '' }) })
  if (filters.minRating > 0) chips.push({ label: `${filters.minRating}+ estrellas`, remove: () => handleFilterChange({ minRating: 0 }) })
  if (filters.verified) chips.push({ label: 'Verificado', remove: () => handleFilterChange({ verified: false }) })
  if (filters.minExperience > 0) chips.push({ label: `${filters.minExperience}+ años exp.`, remove: () => handleFilterChange({ minExperience: 0 }) })
  if (filters.minPrice != null || filters.maxPrice != null) {
    const label = matchedPriceRange ? matchedPriceRange.label
      : filters.maxPrice == null ? `${formatCurrency(filters.minPrice)}+`
      : `${formatCurrency(filters.minPrice)} - ${formatCurrency(filters.maxPrice)}`
    chips.push({ label, remove: clearPrice })
  }
  if (filters.hasPhotos) chips.push({ label: 'Con fotos', remove: () => handleFilterChange({ hasPhotos: false }) })
  if (filters.availability === 'fecha') {
    chips.push({ label: filters.customDate ? `📅 ${filters.customDate}` : '📅 Fecha específica', remove: () => handleFilterChange({ availability: '', customDate: '' }) })
  } else if (filters.availability) {
    chips.push({ label: AVAILABILITY_LABELS[filters.availability], remove: () => handleFilterChange({ availability: '' }) })
  }
  if (filters.lat) chips.push({ label: filters.maxDistanceKm < DISTANCE_MAX ? `📍 Hasta ${filters.maxDistanceKm} km` : '📍 Cerca de ti', remove: disableLocation })

  const advancedCount = [selectedCategory, filters.serviceType, filters.minRating > 0, filters.verified, filters.minExperience > 0, filters.minPrice != null || filters.maxPrice != null, filters.hasPhotos, filters.lat].filter(Boolean).length
  const hasAnyFilter = chips.length > 0
  const noResults = !loading && result.content.length === 0

  const emptyStateActions = []
  if (selectedCategory) emptyStateActions.push({ label: 'Quitar categoría', run: () => handleFilterChange({ categoryId: '', serviceType: '' }) })
  if (filters.serviceType) emptyStateActions.push({ label: 'Quitar tipo específico', run: () => handleFilterChange({ serviceType: '' }) })
  if (filters.city) emptyStateActions.push({ label: 'Quitar ubicación', run: () => handleFilterChange({ city: '' }) })
  if (filters.minRating > 0) emptyStateActions.push({ label: 'Quitar calificación mínima', run: () => handleFilterChange({ minRating: 0 }) })
  if (filters.verified) emptyStateActions.push({ label: 'Quitar filtro "Verificado"', run: () => handleFilterChange({ verified: false }) })
  if (filters.minExperience > 0) emptyStateActions.push({ label: 'Quitar años de experiencia', run: () => handleFilterChange({ minExperience: 0 }) })
  if (filters.minPrice != null || filters.maxPrice != null) emptyStateActions.push({ label: 'Quitar filtro de precio', run: clearPrice })
  if (filters.hasPhotos) emptyStateActions.push({ label: 'Quitar "con fotos"', run: () => handleFilterChange({ hasPhotos: false }) })
  if (filters.availability) emptyStateActions.push({ label: 'Cambiar disponibilidad', run: () => handleFilterChange({ availability: '', customDate: '' }) })
  if (filters.lat && filters.maxDistanceKm < DISTANCE_MAX) emptyStateActions.push({ label: 'Ampliar distancia', run: () => handleFilterChange({ maxDistanceKm: DISTANCE_MAX }) })

  return (
    <div className="container-app py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Encuentra al prestador ideal</h1>
      <p className="text-sm text-gray-500 mb-6">Plomeros, electricistas, limpieza, jardinería y más — cerca de ti.</p>

      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-[2] min-w-[240px]">
            <label className="text-xs font-medium text-gray-600 block mb-1">¿Qué servicio necesitas?</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
              <input className="input pl-9" placeholder="Ej. Plomero, fuga de agua, limpieza..." value={filters.q}
                onChange={handleSearchChange} />
            </div>
            <button type="button" onClick={() => { setSuggestionDismissed(false); setSuggestionApplied(false); handleFilterChange({ q: EXAMPLE_TEXT }) }}
              className="text-xs text-primary-600 hover:text-primary-700 mt-1 text-left">
              Probar: "{EXAMPLE_TEXT}"
            </button>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Ubicación <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-7.6-7-12a7 7 0 0 1 14 0c0 4.4-7 12-7 12z"></path><circle cx="12" cy="9" r="2.5"></circle></svg>
              </span>
              <input className="input pl-9" placeholder="Colonia o ciudad" value={filters.city}
                onChange={(e) => handleFilterChange({ city: e.target.value })} />
            </div>
          </div>
          <div className="flex-none">
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Disponibilidad <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <div className="flex gap-1.5">
              {['hoy', 'manana', 'semana'].map((value) => (
                <button key={value} type="button"
                  onClick={() => handleFilterChange({ availability: filters.availability === value ? '' : value, customDate: '' })}
                  className={`text-xs font-medium px-2.5 py-2 rounded-lg border whitespace-nowrap transition-colors ${
                    filters.availability === value ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}>
                  {AVAILABILITY_LABELS[value]}
                </button>
              ))}
              <button type="button"
                onClick={() => handleFilterChange({ availability: filters.availability === 'fecha' ? '' : 'fecha', customDate: '' })}
                className={`text-xs font-medium px-2.5 py-2 rounded-lg border flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  filters.availability === 'fecha' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                Fecha
              </button>
            </div>
            {filters.availability === 'fecha' && (
              <input type="date" className="input mt-2" value={filters.customDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => handleFilterChange({ customDate: e.target.value })} />
            )}
          </div>
        </div>

        {showSuggestion && (
          <div className="mt-3 bg-primary-50 border border-primary-100 rounded-lg px-3 py-2 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-sm text-primary-700">
              Detectamos: <strong>{detected.icon} {detected.name}</strong>. ¿Aplicamos este filtro?
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={applySuggestion} className="btn-primary text-xs px-3 py-1.5">Aplicar</button>
              <button type="button" onClick={() => setSuggestionDismissed(true)} className="text-xs text-gray-500 hover:text-gray-700">Ahora no</button>
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <button type="button" onClick={() => setMoreFiltersOpen((v) => !v)}
            className="btn-secondary text-sm inline-flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
            Más filtros
            {advancedCount > 0 && (
              <span className="bg-primary-600 text-white text-[11px] font-semibold rounded-full min-w-[18px] h-[18px] inline-flex items-center justify-center px-1">
                {advancedCount}
              </span>
            )}
          </button>
          {hasAnyFilter && (
            <button type="button" onClick={clearAll} className="text-sm text-gray-500 hover:text-gray-700">Limpiar todo</button>
          )}
        </div>

        {moreFiltersOpen && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-2">Categoría</div>
              <select className="input" value={filters.categoryId}
                onChange={(e) => handleFilterChange({ categoryId: e.target.value, serviceType: '' })}>
                <option value="">Todas las categorías</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
              {selectedCategory && serviceTypes.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Tipo específico</div>
                  <select className="input" value={filters.serviceType} onChange={(e) => handleFilterChange({ serviceType: e.target.value })}>
                    <option value="">Todos los tipos</option>
                    {serviceTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-700 mb-2">Calificación mínima</div>
              <div className="flex gap-1.5 mb-4">
                {[3, 4, 4.5].map((r) => (
                  <button key={r} type="button" onClick={() => handleFilterChange({ minRating: filters.minRating === r ? 0 : r })}
                    className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border flex-1 transition-colors ${
                      filters.minRating === r ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}>
                    {r}+ ★
                  </button>
                ))}
              </div>
              <div className="text-xs font-semibold text-gray-700 mb-2">Años de experiencia</div>
              <div className="flex flex-wrap gap-1.5">
                {[1, 3, 5, 10].map((n) => (
                  <button key={n} type="button" onClick={() => handleFilterChange({ minExperience: filters.minExperience === n ? 0 : n })}
                    className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                      filters.minExperience === n ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}>
                    {n}+ años
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-700 mb-2">Rango de precio</div>
                <select className="input" value={priceSelectValue}
                  onChange={(e) => {
                    const value = e.target.value
                    setOtroMin('')
                    setOtroMax('')
                    if (value === '') {
                      setPriceMode(null)
                      handleFilterChange({ minPrice: null, maxPrice: null })
                    } else if (value === 'otro') {
                      setPriceMode('otro')
                      handleFilterChange({ minPrice: null, maxPrice: null })
                    } else {
                      const r = PRICE_RANGES.find((x) => x.id === value)
                      setPriceMode(r.id)
                      handleFilterChange({ minPrice: r.min, maxPrice: r.max })
                    }
                  }}>
                  <option value="">Todos los precios</option>
                  {PRICE_RANGES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                  <option value="otro">Otro (rango personalizado)</option>
                </select>
                {priceMode === 'otro' && (
                  <div className="flex gap-2 items-start flex-wrap mt-2">
                    <input type="number" min={1} step={1} placeholder="Mínimo" className="input w-24"
                      value={otroMin} onChange={(e) => setOtroMin(e.target.value)} />
                    {isPositiveInt(otroMin) && (
                      <input type="number" min={1} step={1} placeholder="Máximo" className="input w-24"
                        value={otroMax} onChange={(e) => setOtroMax(e.target.value)} />
                    )}
                  </div>
                )}
                {priceMode === 'otro' && isPositiveInt(otroMin) && otroMax !== '' && !(isPositiveInt(otroMax) && Number(otroMax) > Number(otroMin)) && (
                  <p className="text-xs text-red-600 mt-1">El máximo debe ser un entero mayor al mínimo.</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Prestador verificado</span>
                <button type="button" onClick={() => handleFilterChange({ verified: !filters.verified })}
                  className={`w-9 h-5 rounded-full relative transition-colors ${filters.verified ? 'bg-primary-600' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${filters.verified ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm text-gray-700">Con fotos de trabajos</span>
                <button type="button" onClick={() => handleFilterChange({ hasPhotos: !filters.hasPhotos })}
                  className={`w-9 h-5 rounded-full relative transition-colors ${filters.hasPhotos ? 'bg-primary-600' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${filters.hasPhotos ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm text-gray-700">Lo necesito con urgencia</span>
                <button type="button" onClick={() => handleFilterChange({ availability: filters.availability === 'hoy' ? '' : 'hoy' })}
                  className={`w-9 h-5 rounded-full relative transition-colors ${filters.availability === 'hoy' ? 'bg-primary-600' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${filters.availability === 'hoy' ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>

            <div className="md:col-span-3 pt-4 border-t border-gray-100">
              <div className="text-xs font-semibold text-gray-700 mb-2">Distancia</div>
              {!filters.lat ? (
                <div>
                  <button type="button" onClick={requestLocation} disabled={locationLoading} className="btn-secondary text-xs">
                    {locationLoading ? 'Obteniendo ubicación...' : '📍 Usar mi ubicación'}
                  </button>
                  {locationError && <p className="text-xs text-red-600 mt-1.5">{locationError}</p>}
                  <p className="text-xs text-gray-400 mt-1.5">Para filtrar u ordenar por cercanía necesitamos tu ubicación aproximada.</p>
                </div>
              ) : (
                <div>
                  <div className="text-xs text-gray-600 mb-2">
                    Hasta {filters.maxDistanceKm < DISTANCE_MAX ? `${filters.maxDistanceKm} km` : 'sin límite'}
                    <button type="button" onClick={disableLocation} className="ml-3 text-primary-600 hover:text-primary-700 font-medium">Desactivar ubicación</button>
                  </div>
                  <input type="range" min={DISTANCE_MIN} max={DISTANCE_MAX} value={filters.maxDistanceKm}
                    onChange={(e) => handleFilterChange({ maxDistanceKm: Number(e.target.value) })}
                    className="w-full max-w-sm accent-primary-600" />
                  <p className="text-xs text-gray-400 mt-1.5">Aproximada: se calcula desde el centro de tu ciudad, no tu dirección exacta.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {hasAnyFilter && (
          <div className="mt-4 flex flex-wrap gap-2">
            {chips.map((chip, i) => <FilterChip key={i} label={chip.label} onRemove={chip.remove} />)}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="text-sm text-gray-700">
          <strong className="text-gray-900 text-base">{result.totalElements ?? result.content.length}</strong> prestadores encontrados
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Ordenar por</span>
          <select className="input !w-auto" value={filters.sort} onChange={(e) => handleFilterChange({ sort: e.target.value })}>
            <option value="recomendados">Recomendados</option>
            <option value="rating">Mejor calificados</option>
            <option value="name">Nombre</option>
            <option value="cercanos" disabled={!filters.lat}>Más cercanos{!filters.lat ? ' (activa tu ubicación)' : ''}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : noResults ? (
        <div className="card border-dashed p-10 text-center">
          <p className="font-semibold text-gray-900">No encontramos prestadores con estos filtros</p>
          <p className="text-sm text-gray-500 mt-1">Prueba alguna de estas opciones:</p>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {emptyStateActions.map((action, i) => (
              <button key={i} type="button" onClick={action.run} className="btn-secondary text-xs">{action.label}</button>
            ))}
          </div>
          {similar.length > 0 && (
            <div className="mt-8 text-left">
              <p className="text-sm font-semibold text-gray-900 mb-3">Prestadores similares que podrían interesarte</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {similar.map((p) => <ProviderCard key={p.id} provider={p} />)}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {result.content.map((p) => <ProviderCard key={p.id} provider={p} />)}
        </div>
      )}

      <Pagination page={result.page ?? page} totalPages={result.totalPages} onPageChange={setPage} />
    </div>
  )
}
