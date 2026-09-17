import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  adminListProviders, adminSetProviderVerified, adminSetProviderEmailVerified,
  adminSetProviderPhoneVerified, adminSetProviderProfileComplete,
} from '../../api/providers'
import { useNotify } from '../../context/NotifyContext'
import RatingStars from '../../components/RatingStars'
import AdminPagination from '../../components/AdminPagination'

const VERIFICATION_FIELDS = [
  { key: 'isVerified', label: 'Identidad', setter: adminSetProviderVerified },
  { key: 'emailVerified', label: 'Correo', setter: adminSetProviderEmailVerified },
  { key: 'phoneVerified', label: 'Telefono', setter: adminSetProviderPhoneVerified },
  { key: 'profileComplete', label: 'Perfil', setter: adminSetProviderProfileComplete },
]

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

  async function toggleField(provider, field) {
    try {
      await field.setter(provider.id, !provider[field.key])
      notify(`${field.label}: actualizado`, 'success')
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
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Negocio</th>
                  <th className="px-4 py-3 font-medium">Ciudad</th>
                  <th className="px-4 py-3 font-medium">Calificacion</th>
                  <th className="px-4 py-3 font-medium">Verificacion (clic para autorizar)</th>
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
                      <div className="flex flex-wrap gap-1.5">
                        {VERIFICATION_FIELDS.map((f) => (
                          <button
                            key={f.key}
                            onClick={() => toggleField(p, f)}
                            title={p[f.key] ? `Quitar ${f.label.toLowerCase()}` : `Autorizar ${f.label.toLowerCase()}`}
                            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full transition-colors ${
                              p[f.key] ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {p[f.key] ? '✓' : '○'} {f.label}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
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
