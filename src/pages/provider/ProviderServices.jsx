import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listMyServices, deactivateMyService, reactivateMyService } from '../../api/services'
import { useNotify } from '../../context/NotifyContext'
import { formatCurrency } from '../../utils/format'

const PRICE_TYPE_LABELS = { FIJO: 'Precio fijo', POR_HORA: 'Por hora', COTIZACION: 'A cotizar' }

export default function ProviderServices() {
  const { notify, confirmDialog } = useNotify()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    listMyServices({ size: 50 }).then((r) => setServices(r.data.data.content)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleDeactivate(id) {
    const ok = await confirmDialog('¿Desactivar este servicio? Ya no sera visible para nuevos clientes.', { title: 'Desactivar servicio' })
    if (!ok) return
    try {
      await deactivateMyService(id)
      notify('Servicio desactivado', 'success')
      load()
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo desactivar', 'error')
    }
  }

  async function handleReactivate(id) {
    try {
      await reactivateMyService(id)
      notify('Servicio activado', 'success')
      load()
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo activar', 'error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis servicios</h1>
        <Link to="/prestador/servicios/nuevo" className="btn-primary text-sm">+ Nuevo servicio</Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : services.length === 0 ? (
        <p className="text-gray-500">Aun no has publicado ningun servicio.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <div key={s.id} className={`card p-4 ${!s.isActive ? 'opacity-60' : ''}`}>
              <div className="relative">
                {s.images?.[0] && (
                  <img
                    src={s.images[0].url}
                    alt=""
                    className={`w-full h-32 object-cover rounded-lg mb-3 ${!s.isActive ? 'grayscale' : ''}`}
                  />
                )}
                {!s.isActive && (
                  <span className="absolute top-2 left-2 text-xs font-medium bg-gray-800 text-white px-2 py-0.5 rounded-full">
                    Inactivo
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900">{s.title}</h3>
              <p className="text-sm text-gray-500">{s.categoryName}</p>
              <p className="font-semibold text-gray-900 mt-1">{formatCurrency(s.price)} <span className="text-xs font-normal text-gray-500">({PRICE_TYPE_LABELS[s.priceType]})</span></p>
              <div className="flex gap-2 mt-3">
                <Link to={`/prestador/servicios/${s.id}`} className="btn-secondary text-xs flex-1 text-center py-1.5 flex items-center justify-center gap-1">
                  <span aria-hidden="true">✏️</span> Editar
                </Link>
                {s.isActive ? (
                  <button onClick={() => handleDeactivate(s.id)} className="btn-secondary text-xs flex-1 py-1.5 text-red-600 flex items-center justify-center gap-1">
                    <span aria-hidden="true">🚫</span> Desactivar
                  </button>
                ) : (
                  <button onClick={() => handleReactivate(s.id)} className="btn-secondary text-xs flex-1 py-1.5 text-green-700 flex items-center justify-center gap-1">
                    <span aria-hidden="true">✅</span> Activar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
