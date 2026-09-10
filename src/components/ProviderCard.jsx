import { Link } from 'react-router-dom'
import RatingStars from './RatingStars'
import { formatCurrency } from '../utils/format'

export default function ProviderCard({ provider }) {
  return (
    <Link to={`/prestadores/${provider.id}`} className="card p-4 flex gap-4 hover:shadow-md transition-shadow">
      <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl shrink-0 overflow-hidden">
        {provider.profileImageUrl ? (
          <img src={provider.profileImageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span role="img" aria-label="Prestador de servicio">👷</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 truncate">{provider.businessName}</h3>
          {provider.isVerified && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full shrink-0">Verificado</span>}
        </div>
        <p className="text-sm text-gray-500 truncate">{provider.city}</p>
        <div className="flex items-center gap-2 mt-1">
          <RatingStars value={provider.averageRating} />
          <span className="text-xs text-gray-500">({provider.totalReviews ?? 0})</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {(provider.categories ?? []).slice(0, 3).map((c) => (
            <span key={c.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.icon} {c.name}</span>
          ))}
        </div>
        {provider.fromPrice != null && (
          <p className="text-sm text-gray-700 mt-2">Desde <span className="font-semibold">{formatCurrency(provider.fromPrice)}</span></p>
        )}
      </div>
    </Link>
  )
}
