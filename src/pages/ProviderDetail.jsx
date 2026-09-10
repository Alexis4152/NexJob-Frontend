import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProviderDetail } from '../api/providers'
import RatingStars from '../components/RatingStars'
import { formatCurrency, formatDate } from '../utils/format'

const PRICE_TYPE_LABELS = { FIJO: 'precio fijo', POR_HORA: 'por hora', COTIZACION: 'a cotizar' }
const DURATION_UNIT_LABELS = { MINUTOS: 'min', DIAS: 'dias', SEMANAS: 'semanas', MESES: 'meses' }

export default function ProviderDetail() {
  const { id } = useParams()
  const [provider, setProvider] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getProviderDetail(id).then((r) => setProvider(r.data.data)).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="container-app py-12 text-gray-500">Cargando...</div>
  if (!provider) return <div className="container-app py-12 text-gray-500">Prestador no encontrado.</div>

  return (
    <div className="container-app py-8">
      <div className="card p-6 mb-6 flex flex-col sm:flex-row gap-6">
        <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-4xl shrink-0 overflow-hidden">
          {provider.profileImageUrl ? (
            <img src={provider.profileImageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span role="img" aria-label="Prestador de servicio">👷</span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{provider.businessName}</h1>
            {provider.isVerified && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">Verificado</span>}
          </div>
          <p className="text-gray-500">{provider.city} {provider.yearsExperience ? `· ${provider.yearsExperience} anos de experiencia` : ''}</p>
          <div className="flex items-center gap-2 mt-2">
            <RatingStars value={provider.averageRating} />
            <span className="text-sm text-gray-500">{provider.averageRating ?? 0} ({provider.totalReviews ?? 0} resenas)</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-3">
            {provider.categories.map((c) => (
              <span key={c.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.icon} {c.name}</span>
            ))}
          </div>
          {provider.bio && <p className="text-gray-700 mt-3">{provider.bio}</p>}
        </div>
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-3">Servicios que ofrece</h2>
      {provider.services.length === 0 ? (
        <p className="text-gray-500 mb-8">Este prestador aun no ha publicado servicios.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {provider.services.map((s) => (
            <div key={s.id} className="card p-4">
              {s.images?.[0] && <img src={s.images[0].url} alt="" className="w-full h-36 object-cover rounded-lg mb-3" />}
              <h3 className="font-semibold text-gray-900">{s.title}</h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-3">{s.description}</p>
              {s.estimatedDurationValue ? (
                <p className="text-xs text-gray-500 mt-1">Duracion estimada: {s.estimatedDurationValue} {DURATION_UNIT_LABELS[s.estimatedDurationUnit] || ''}</p>
              ) : null}
              <div className="flex items-center justify-between mt-3">
                <span className="font-semibold text-gray-900">
                  {formatCurrency(s.price)} <span className="text-xs font-normal text-gray-500">({PRICE_TYPE_LABELS[s.priceType]})</span>
                </span>
                <Link to={`/contratar/${s.id}`} className="btn-primary text-sm">Contratar</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-lg font-bold text-gray-900 mb-3">Resenas de clientes</h2>
      {provider.recentReviews.length === 0 ? (
        <p className="text-gray-500">Aun no tiene resenas.</p>
      ) : (
        <div className="space-y-3">
          {provider.recentReviews.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-medium text-gray-900">{r.clientFirstName}</span>
                <span className="text-xs text-gray-400 shrink-0">{formatDate(r.createdAt)}</span>
              </div>
              <RatingStars value={r.rating} size="text-sm" />
              {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
