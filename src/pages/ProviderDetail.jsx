import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProviderDetail } from '../api/providers'
import RatingStars from '../components/RatingStars'
import TrustBadge from '../components/TrustBadge'
import { formatCurrency, formatDateOnly, formatResponseTime } from '../utils/format'

const PRICE_TYPE_LABELS = { FIJO: 'precio fijo', POR_HORA: 'por hora', COTIZACION: 'a cotizar' }
const DURATION_UNIT_LABELS = { MINUTOS: 'min', DIAS: 'dias', SEMANAS: 'semanas', MESES: 'meses' }

const PHOTOS_PREVIEW = 8
const REVIEWS_PREVIEW = 3

function TrustItem({ status, label }) {
  const ok = status === 'done'
  return (
    <div className={`flex items-center gap-2 text-sm ${ok ? 'text-gray-700' : 'text-gray-400'}`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ok ? '#16A34A' : 'currentColor'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle>{ok && <path d="M8 12l3 3 5-6"></path>}</svg>
      {label}
    </div>
  )
}

export default function ProviderDetail() {
  const { id } = useParams()
  const [provider, setProvider] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)

  useEffect(() => {
    setLoading(true)
    setShowAllPhotos(false)
    setShowAllReviews(false)
    getProviderDetail(id).then((r) => setProvider(r.data.data)).finally(() => setLoading(false))
  }, [id])

  const allPhotos = useMemo(() => {
    if (!provider) return []
    return provider.services.flatMap((s) => s.images?.map((img) => ({ ...img, serviceTitle: s.title })) || [])
  }, [provider])

  if (loading) return <div className="container-app py-12 text-gray-500">Cargando...</div>
  if (!provider) return <div className="container-app py-12 text-gray-500">Prestador no encontrado.</div>

  const photosToShow = showAllPhotos ? allPhotos : allPhotos.slice(0, PHOTOS_PREVIEW)
  const reviewsToShow = showAllReviews ? provider.recentReviews : provider.recentReviews.slice(0, REVIEWS_PREVIEW)

  return (
    <div className="container-app py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">

        <div className="flex flex-col gap-6 min-w-0">

          {/* Identidad */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 shrink-0 overflow-hidden">
                {provider.profileImageUrl ? (
                  <img src={provider.profileImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4 4-6 8-6s8 2 8 6"></path></svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">{provider.businessName}</h1>
                  <TrustBadge tier={provider.trustTier} />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <RatingStars value={provider.averageRating} />
                  <span className="text-sm text-gray-500">{provider.averageRating ?? 0} ({provider.totalReviews ?? 0} resenas)</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {provider.categories.map((c) => (
                    <span key={c.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.icon} {c.name}</span>
                  ))}
                </div>
              </div>
            </div>

            {provider.bio && (
              <p className="text-sm text-gray-700 leading-relaxed mt-4 border-l-2 border-primary-100 pl-3">{provider.bio}</p>
            )}

            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
              {provider.yearsExperience ? (
                <span className="flex items-center gap-1.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                  {provider.yearsExperience} años de experiencia
                </span>
              ) : null}
              {provider.city ? (
                <span className="flex items-center gap-1.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-7.6-7-12a7 7 0 0 1 14 0c0 4.4-7 12-7 12z"></path><circle cx="12" cy="9" r="2.5"></circle></svg>
                  {provider.city}
                </span>
              ) : null}
              {provider.completedJobs > 0 ? (
                <span className="flex items-center gap-1.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  {provider.completedJobs} trabajos realizados
                </span>
              ) : null}
              {formatResponseTime(provider.averageResponseMinutes) ? (
                <span className="flex items-center gap-1.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Responde en {formatResponseTime(provider.averageResponseMinutes)}
                </span>
              ) : null}
            </div>
          </div>

          {/* Confianza */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#155DEA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              <h2 className="text-base font-bold text-gray-900">Por que confiar en este prestador</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              <TrustItem status={provider.isVerified ? 'done' : 'pending'} label="Identidad verificada" />
              <TrustItem status={provider.emailVerified ? 'done' : 'pending'} label="Correo verificado" />
              <TrustItem status={provider.phoneVerified ? 'done' : 'pending'} label="Telefono verificado" />
              <TrustItem status={provider.profileComplete ? 'done' : 'pending'} label="Perfil completo" />
              <div className="sm:col-span-2 flex items-start gap-2 text-sm text-gray-700">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"></circle><path d="M8 12l3 3 5-6"></path></svg>
                <span><span className="font-medium">Pago protegido</span> — se libera hasta que apruebes el trabajo</span>
              </div>
            </div>
          </div>

          {/* Trabajos realizados */}
          {allPhotos.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900">Trabajos realizados</h2>
                {allPhotos.length > PHOTOS_PREVIEW && (
                  <button type="button" onClick={() => setShowAllPhotos((v) => !v)} className="text-sm text-primary-700 hover:underline">
                    {showAllPhotos ? 'Ver menos' : 'Ver mas'}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {photosToShow.map((img) => (
                  <img key={img.id} src={img.url} alt={img.serviceTitle} className="aspect-square w-full object-cover rounded-lg" />
                ))}
              </div>
            </div>
          )}

          {/* Servicios */}
          <div className="card p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Servicios que ofrece</h2>
            {provider.services.length === 0 ? (
              <p className="text-gray-500">Este prestador aun no ha publicado servicios.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {provider.services.map((s) => (
                  <div key={s.id} className="border border-gray-100 rounded-xl p-4">
                    {s.images?.[0] && <img src={s.images[0].url} alt="" className="w-full h-36 object-cover rounded-lg mb-3" />}
                    <h3 className="font-semibold text-gray-900">{s.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-3">{s.description}</p>
                    {s.estimatedDurationValue ? (
                      <p className="text-xs text-gray-500 mt-1">Duracion estimada: {s.estimatedDurationValue} {DURATION_UNIT_LABELS[s.estimatedDurationUnit] || ''}</p>
                    ) : null}
                    <span className={`inline-block text-xs mt-2 px-2 py-0.5 rounded-full ${s.atClientLocation ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {s.atClientLocation ? '🚗 A domicilio' : '📍 En sitio del prestador'}
                    </span>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(s.price)} <span className="text-xs font-normal text-gray-500">({PRICE_TYPE_LABELS[s.priceType]})</span>
                      </span>
                      <Link to={`/contratar/${s.id}`} className="btn-primary text-sm">Solicitar cotización</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resenas */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">{provider.totalReviews ?? 0} opiniones</h2>
              {provider.recentReviews.length > REVIEWS_PREVIEW && (
                <button type="button" onClick={() => setShowAllReviews((v) => !v)} className="text-sm text-primary-700 hover:underline">
                  {showAllReviews ? 'Ver menos' : 'Ver mas'}
                </button>
              )}
            </div>
            {provider.recentReviews.length === 0 ? (
              <p className="text-gray-500">Aun no tiene resenas.</p>
            ) : (
              <div className="space-y-3">
                {reviewsToShow.map((r) => (
                  <div key={r.id} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                    <RatingStars value={r.rating} size="text-sm" />
                    {r.comment && <p className="text-sm text-gray-700 mt-1">"{r.comment}"</p>}
                    <span className="block text-xs text-gray-400 mt-1">{r.clientFirstName} · {formatDateOnly(r.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-6">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 shrink-0 overflow-hidden">
                {provider.profileImageUrl ? (
                  <img src={provider.profileImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4 4-6 8-6s8 2 8 6"></path></svg>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{provider.businessName}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span className="text-amber-400">★</span>
                  {provider.averageRating ?? 0} ({provider.totalReviews ?? 0})
                </div>
              </div>
            </div>

            <div className="bg-primary-50 rounded-lg px-3 py-2.5 flex gap-2 items-start mb-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#155DEA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              <span className="text-xs text-primary-800 leading-relaxed">Pago protegido: se libera hasta que apruebes que el trabajo quedo bien.</span>
            </div>

            <button type="button" disabled className="relative w-full bg-gray-100 text-gray-400 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold cursor-not-allowed">
              Enviar mensaje
              <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">PRONTO</span>
            </button>
            <p className="text-xs text-gray-400 mt-2 text-center">Elige un servicio abajo para cotizar</p>
          </div>
        </div>

      </div>
    </div>
  )
}
