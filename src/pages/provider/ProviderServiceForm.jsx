import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { listCategories } from '../../api/categories'
import { getMyService, createMyService, updateMyService, addMyServiceImage, removeMyServiceImage } from '../../api/services'
import { useNotify } from '../../context/NotifyContext'

export default function ProviderServiceForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { notify } = useNotify()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ categoryId: '', title: '', description: '', price: '', priceType: 'FIJO', estimatedDurationValue: '', estimatedDurationUnit: 'MINUTOS' })
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [createdId, setCreatedId] = useState(null)

  // Una vez creado el servicio (o si ya veniamos a editar uno existente), esta es la referencia
  // a usar para guardar cambios y subir la foto, sin necesidad de navegar a otra pagina.
  const effectiveId = id || createdId

  useEffect(() => {
    listCategories().then((r) => setCategories(r.data.data))
    if (isEdit) {
      getMyService(id).then((r) => {
        const s = r.data.data
        setForm({
          categoryId: s.categoryId, title: s.title, description: s.description || '',
          price: s.price, priceType: s.priceType,
          estimatedDurationValue: s.estimatedDurationValue ?? '',
          estimatedDurationUnit: s.estimatedDurationUnit || 'MINUTOS',
        })
        setImages(s.images || [])
      }).finally(() => setLoading(false))
    }
  }, [id])

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      categoryId: Number(form.categoryId),
      price: Number(form.price),
      estimatedDurationValue: form.estimatedDurationValue ? Number(form.estimatedDurationValue) : null,
    }
    try {
      if (effectiveId) {
        await updateMyService(effectiveId, payload)
        notify('Servicio actualizado', 'success')
      } else {
        const res = await createMyService(payload)
        setCreatedId(res.data.data.id)
        setImages(res.data.data.images || [])
        notify('Servicio publicado. Ya puedes agregarle una foto.', 'success')
      }
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo guardar el servicio', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const res = await addMyServiceImage(effectiveId, file)
      setImages(res.data.data.images)
      notify('Imagen agregada', 'success')
      navigate('/prestador/servicios')
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo subir la imagen', 'error')
    }
  }

  async function handleRemoveImage(imageId) {
    try {
      await removeMyServiceImage(effectiveId, imageId)
      setImages((imgs) => imgs.filter((i) => i.id !== imageId))
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo eliminar la imagen', 'error')
    }
  }

  if (loading) return <p className="text-gray-500">Cargando...</p>

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Editar servicio' : 'Nuevo servicio'}</h1>
        <Link to="/prestador/servicios" className="text-sm text-primary-700 hover:underline">← Mis servicios</Link>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="block text-gray-700 mb-1 font-medium">Categoria</span>
            <select required className="input" value={form.categoryId} onChange={set('categoryId')}>
              <option value="">Selecciona una categoria</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="block text-gray-700 mb-1 font-medium">Titulo del servicio</span>
            <input required className="input" placeholder="Ej. Instalacion de closet a medida" value={form.title} onChange={set('title')} />
          </label>
          <label className="block text-sm">
            <span className="block text-gray-700 mb-1 font-medium">Descripcion</span>
            <textarea className="input" rows={4} value={form.description} onChange={set('description')} />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Precio</span>
              <input required type="number" min="0" step="0.01" className="input" value={form.price} onChange={set('price')} />
            </label>
            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Tipo de precio</span>
              <select className="input" value={form.priceType} onChange={set('priceType')}>
                <option value="FIJO">Precio fijo</option>
                <option value="POR_HORA">Por hora</option>
                <option value="COTIZACION">A cotizar</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Duracion estimada</span>
              <input type="number" min="0" className="input" value={form.estimatedDurationValue} onChange={set('estimatedDurationValue')} />
            </label>
            <label className="block text-sm">
              <span className="block text-gray-700 mb-1 font-medium">Unidad</span>
              <select className="input" value={form.estimatedDurationUnit} onChange={set('estimatedDurationUnit')}>
                <option value="MINUTOS">Minutos</option>
                <option value="DIAS">Dias</option>
                <option value="SEMANAS">Semanas</option>
                <option value="MESES">Meses</option>
              </select>
            </label>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Guardando...' : effectiveId ? 'Guardar cambios' : 'Publicar servicio'}
          </button>
        </form>

        {effectiveId && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Foto del servicio</h3>
            {images.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                  {images.map((img) => (
                    <div key={img.id} className="relative">
                      <img src={img.url} alt="" className="w-full h-20 object-cover rounded-lg" />
                      <button onClick={() => handleRemoveImage(img.id)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs leading-none">✕</button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">Solo se permite una foto por servicio. Eliminala para subir otra.</p>
              </>
            ) : (
              <input type="file" accept="image/*" onChange={handleAddImage} className="text-sm" />
            )}
          </div>
        )}

        {!isEdit && createdId && (
          <Link to="/prestador/servicios" className="btn-secondary w-full text-center block mt-4">
            Listo, volver a mis servicios
          </Link>
        )}
      </div>
    </div>
  )
}
