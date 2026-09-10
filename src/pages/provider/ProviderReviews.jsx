import { useEffect, useState } from 'react'
import { listMyServices } from '../../api/services'
import { getMyReviews } from '../../api/reviews'
import RatingStars from '../../components/RatingStars'
import { formatDate } from '../../utils/format'

export default function ProviderReviews() {
  const [services, setServices] = useState([])
  const [serviceId, setServiceId] = useState('')
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listMyServices({ size: 100 }).then((r) => setServices(r.data.data.content))
  }, [])

  useEffect(() => {
    setLoading(true)
    getMyReviews({ serviceId: serviceId || undefined, size: 50 })
      .then((r) => setReviews(r.data.data.content))
      .finally(() => setLoading(false))
  }, [serviceId])

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Resenas</h1>
        <div className="min-w-[220px]">
          <select className="input" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            <option value="">Todos los servicios</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : reviews.length === 0 ? (
        <p className="text-gray-500">
          {serviceId ? 'Este servicio aun no tiene resenas.' : 'Aun no has recibido resenas.'}
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <RatingStars value={r.rating} />
                  <span className="font-medium text-gray-900">{r.clientFirstName} {r.clientLastName}</span>
                </div>
                <span className="text-xs text-gray-500">{formatDate(r.createdAt)}</span>
              </div>
              <p className="text-xs text-primary-700 font-medium mt-1">{r.serviceTitle}</p>
              {r.comment && <p className="text-sm text-gray-600 mt-2">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
