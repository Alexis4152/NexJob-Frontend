import { useEffect, useState } from 'react'
import { adminListUsers, adminSetUserActive } from '../../api/users'
import { useNotify } from '../../context/NotifyContext'
import AdminPagination from '../../components/AdminPagination'

export default function AdminUsers() {
  const { notify } = useNotify()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [result, setResult] = useState({ content: [], totalPages: 0, totalElements: 0 })
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    adminListUsers({ role: 'CLIENT', q: q || undefined, page, size: 20 }).then((r) => setResult(r.data.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page])

  async function toggleActive(u) {
    try {
      await adminSetUserActive(u.id, !u.isActive)
      notify('Estado del cliente actualizado', 'success')
      load()
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo actualizar', 'error')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Clientes</h1>

      <form onSubmit={(e) => { e.preventDefault(); setPage(0); load() }} className="card p-4 mb-4 flex gap-3">
        <input className="input flex-1" placeholder="Buscar por correo..." value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="submit" className="btn-primary text-sm">Buscar</button>
      </form>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <p className="text-gray-500 text-sm p-4">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Correo</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {result.content.map((u) => (
                  <tr key={u.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                        {u.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => toggleActive(u)} className="text-primary-700 hover:underline">
                        {u.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
                {result.content.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Sin clientes.</td></tr>
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
