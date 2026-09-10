import { useEffect, useState } from 'react'
import { adminListCategories, adminCreateCategory, adminUpdateCategory, adminDeactivateCategory } from '../../api/categories'
import { useNotify } from '../../context/NotifyContext'
import AdminPagination from '../../components/AdminPagination'

const EMPTY_FORM = { name: '', description: '', icon: '' }

export default function AdminCategories() {
  const { notify, confirmDialog } = useNotify()
  const [page, setPage] = useState(0)
  const [result, setResult] = useState({ content: [], totalPages: 0, totalElements: 0 })
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  function load() {
    setLoading(true)
    adminListCategories({ page, size: 20 }).then((r) => setResult(r.data.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page])

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function startEdit(c) {
    setEditingId(c.id)
    setForm({ name: c.name, description: c.description || '', icon: c.icon || '' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await adminUpdateCategory(editingId, form)
        notify('Categoria actualizada', 'success')
      } else {
        await adminCreateCategory(form)
        notify('Categoria creada', 'success')
      }
      cancelEdit()
      load()
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo guardar la categoria', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(id) {
    const ok = await confirmDialog('¿Desactivar esta categoria?', { title: 'Desactivar categoria' })
    if (!ok) return
    try {
      await adminDeactivateCategory(id)
      notify('Categoria desactivada', 'success')
      load()
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo desactivar', 'error')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Categorias de servicio</h1>

      <form onSubmit={handleSubmit} className="card p-4 mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[100px]">
          <label className="text-xs font-medium text-gray-600 block mb-1">Icono</label>
          <input className="input" placeholder="🔧" value={form.icon} onChange={set('icon')} />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs font-medium text-gray-600 block mb-1">Nombre</label>
          <input required className="input" value={form.name} onChange={set('name')} />
        </div>
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs font-medium text-gray-600 block mb-1">Descripcion</label>
          <input className="input" value={form.description} onChange={set('description')} />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="btn-primary text-sm">{editingId ? 'Guardar' : 'Agregar'}</button>
          {editingId && <button type="button" className="btn-secondary text-sm" onClick={cancelEdit}>Cancelar</button>}
        </div>
      </form>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <p className="text-gray-500 text-sm p-4">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Icono</th>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Descripcion</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {result.content.map((c) => (
                  <tr key={c.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-lg">{c.icon}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-gray-500">{c.description}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => startEdit(c)} className="text-primary-700 hover:underline mr-3">Editar</button>
                      <button onClick={() => handleDeactivate(c.id)} className="text-red-600 hover:underline">Desactivar</button>
                    </td>
                  </tr>
                ))}
                {result.content.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Sin categorias.</td></tr>
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
