import { Link } from 'react-router-dom'
import RatingStars from './RatingStars'
import TrustBadge from './TrustBadge'
import { formatCurrency, formatResponseTime } from '../utils/format'

export default function ProviderCard({ provider }) {
  return (
    <Link to={`/prestadores/${provider.id}`} className="bg-white rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 p-4 flex flex-col gap-3">
      <div className="flex gap-4">
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 shrink-0 overflow-hidden">
          {provider.profileImageUrl ? (
            <img src={provider.profileImageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4 4-6 8-6s8 2 8 6"></path></svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{provider.businessName}</h3>
            <TrustBadge tier={provider.trustTier} />
          </div>
          <p className="text-sm text-gray-500 truncate">
            {provider.city}{provider.distanceKm != null && ` · a ${provider.distanceKm.toFixed(1)} km aprox.`}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <RatingStars value={provider.averageRating} />
            <span className="text-xs text-gray-500">({provider.totalReviews ?? 0})</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {(provider.categories ?? []).slice(0, 3).map((c) => (
          <span key={c.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.icon} {c.name}</span>
        ))}
        {provider.yearsExperience != null && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{provider.yearsExperience}+ años exp.</span>
        )}
        {provider.hasPhotos && (
          <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
            Con fotos
          </span>
        )}
        {formatResponseTime(provider.averageResponseMinutes) && (
          <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Responde en {formatResponseTime(provider.averageResponseMinutes)}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between border-t border-gray-100 pt-2">
        <div>
          {provider.fromPrice != null ? (
            <>
              <div className="text-[11px] text-gray-400">Desde</div>
              <div className="text-base font-bold text-gray-900">{formatCurrency(provider.fromPrice)}</div>
            </>
          ) : (
            <span className="text-xs text-gray-400">Precio a cotizar</span>
          )}
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-primary-600 font-medium whitespace-nowrap">
          Toca para ver detalles
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </span>
      </div>
    </Link>
  )
}
