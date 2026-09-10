import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminListProviders, adminSetProviderVerified } from '../../api/providers'
import { useNotify } from '../../context/NotifyContext'
import RatingStars from '../../components/RatingStars'
import AdminPagination from '../../components/AdminPagination'

export default function AdminProviders() {
  const { notify } = useNotify()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [result, setResult] = useState({ content: [], totalPages: 0, totalElements: 0 })
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    adminListProviders({ q: q || undefined, page, size: 20 }).then((r) => setResult(r.data.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page])

  async function toggleVerified(p) {
    try {
      await adminSetProviderVerified(p.id, !p.isVerified)
      notify('Estado de verificacion actualizado', 'success')
      load()
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo actualizar', 'error')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Prestadores de servicio</h1>

      <form onSubmit={(e) => { e.preventDefault(); setPage(0); load() }} className="card p-4 mb-4 flex gap-3">
        <input className="input flex-1" placeholder="Buscar por nombre, ciudad o categoria..." value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="submit" className="btn-primary text-sm">Buscar</button>
      </form>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <p className="text-gray-500 text-sm p-4">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Negocio</th>
                  <th className="px-4 py-3 font-medium">Ciudad</th>
                  <th className="px-4 py-3 font-medium">Calificacion</th>
                  <th className="px-4 py-3 font-medium">Verificado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {result.content.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.businessName}</td>
                    <td className="px-4 py-3 text-gray-500">{p.city}</td>
                    <td className="px-4 py-3"><RatingStars value={p.averageRating} size="text-sm" /></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${p.isVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {p.isVerified ? 'Verificado' : 'Sin verificar'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => toggleVerified(p)} className="text-primary-700 hover:underline mr-3">
                        {p.isVerified ? 'Quitar verificacion' : 'Verificar'}
                      </button>
                      <Link to={`/prestadores/${p.id}`} className="text-gray-500 hover:underline">Ver perfil</Link>
                    </td>
                  </tr>
                ))}
                {result.content.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Sin prestadores.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <AdminPagination
          page={result.page} size={20} totalPages={result.totalPages} totalElements={result.totalElements}
          contentLength={result.content.length} onPageChange={setPage}
        />
      </div>
    </div>
  )
}
