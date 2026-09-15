import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { listCategories } from '../../api/categories'
import { getMyService, createMyService, updateMyService, addMyServiceImage, removeMyServiceImage } from '../../api/services'
import { useNotify } from '../../context/NotifyContext'

const DESCRIPTION_MAX_LENGTH = 500
const MAX_IMAGES = 3

export default function ProviderServiceForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { notify } = useNotify()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    categoryId: '', title: '', description: '', price: '', priceType: 'FIJO',
    estimatedDurationValue: '', estimatedDurationUnit: 'MINUTOS', atClientLocation: true,
  })
  const [images, setImages] = useState([])
  const [pendingFiles, setPendingFiles] = useState([]) // { file, previewUrl }[], aun no subidos
  const [imageLimitMessage, setImageLimitMessage] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [createdId, setCreatedId] = useState(null)

  // Una vez creado el servicio (o si ya veniamos a editar uno existente), esta es la referencia
  // a usar para guardar cambios y subir fotos, sin necesidad de navegar a otra pagina.
  const effectiveId = id || createdId
  const totalImages = images.length + pendingFiles.length

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
          atClientLocation: s.atClientLocation ?? true,
        })
        setImages(s.images || [])
      }).finally(() => setLoading(false))
    }
  }, [id])

  // Libera las URLs temporales de vista previa al reemplazarlas o desmontar, para no dejar fugas.
  useEffect(() => () => { pendingFiles.forEach((p) => URL.revokeObjectURL(p.previewUrl)) }, [])

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function handleSelectImages(e) {
    const files = Array.from(e.target.files || [])
    e.target.value = '' // permite volver a elegir el mismo archivo despues
    if (!files.length) return

    const remaining = MAX_IMAGES - totalImages
    const accepted = files.slice(0, remaining)
    if (files.length > remaining) {
      setImageLimitMessage(`Solo puedes agregar hasta ${MAX_IMAGES} fotos por servicio. Se agregaron ${accepted.length} de las ${files.length} que seleccionaste.`)
    } else {
      setImageLimitMessage('')
    }
    if (accepted.length === 0) return

    setPendingFiles((prev) => [...prev, ...accepted.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))])
  }

  function handleRemovePendingFile(index) {
    setPendingFiles((prev) => {
      const removed = prev[index]
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
    setImageLimitMessage('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const wasEdit = Boolean(effectiveId)
    const payload = {
      ...form,
      categoryId: Number(form.categoryId),
      price: Number(form.price),
      estimatedDurationValue: form.estimatedDurationValue ? Number(form.estimatedDurationValue) : null,
    }
    try {
      let targetId = effectiveId
      if (wasEdit) {
        await updateMyService(targetId, payload)
      } else {
        const res = await createMyService(payload)
        targetId = res.data.data.id
        setCreatedId(targetId)
      }

      // Se suben una por una; si alguna falla, las restantes quedan pendientes para reintentar.
      const stillPending = [...pendingFiles]
      while (stillPending.length > 0) {
        const next = stillPending[0]
        try {
          const res = await addMyServiceImage(targetId, next.file)
          setImages(res.data.data.images)
          URL.revokeObjectURL(next.previewUrl)
          stillPending.shift()
        } catch (imgErr) {
          notify(imgErr.response?.data?.message || 'El servicio se guardo, pero no se pudieron subir todas las fotos', 'error')
          break
        }
      }
      setPendingFiles(stillPending)
      if (stillPending.length > 0) return

      notify(wasEdit ? 'Servicio actualizado' : 'Servicio publicado', 'success')
      if (!wasEdit) navigate('/prestador/servicios')
    } catch (err) {
      notify(err.response?.data?.message || 'No se pudo guardar el servicio', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveImage(imageId) {
    try {
      await removeMyServiceImage(effectiveId, imageId)
      setImages((imgs) => imgs.filter((i) => i.id !== imageId))
      setImageLimitMessage('')
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
            <textarea
              className="input"
              rows={4}
              maxLength={DESCRIPTION_MAX_LENGTH}
              value={form.description}
              onChange={set('description')}
            />
            <span className="block text-xs text-gray-400 mt-1 text-right">
              {form.description.length}/{DESCRIPTION_MAX_LENGTH}
            </span>
          </label>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 text-sm">Fotos del servicio</h3>
              <span className="text-xs text-gray-400">{totalImages}/{MAX_IMAGES}</span>
            </div>

            {(images.length > 0 || pendingFiles.length > 0) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                {images.map((img) => (
                  <div key={img.id} className="relative">
                    <img src={img.url} alt="" className="w-full h-20 object-cover rounded-lg" />
                    <button type="button" onClick={() => handleRemoveImage(img.id)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs leading-none">✕</button>
                  </div>
                ))}
                {pendingFiles.map((pf, i) => (
                  <div key={pf.previewUrl} className="relative">
                    <img src={pf.previewUrl} alt="" className="w-full h-20 object-cover rounded-lg opacity-80" />
                    <span className="absolute bottom-1 left-1 text-[10px] leading-none bg-black/60 text-white px-1 py-0.5 rounded">Pendiente</span>
                    <button type="button" onClick={() => handleRemovePendingFile(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs leading-none">✕</button>
                  </div>
                ))}
              </div>
            )}

            {imageLimitMessage && (
              <p role="alert" className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
                ⚠️ {imageLimitMessage}
              </p>
            )}

            {totalImages < MAX_IMAGES ? (
              <input type="file" accept="image/*" multiple onChange={handleSelectImages} className="text-sm" />
            ) : (
              <p className="text-xs text-gray-500">Alcanzaste el maximo de {MAX_IMAGES} fotos por servicio. Elimina alguna para agregar otra.</p>
            )}
          </div>

          <label className="flex items-start gap-2 text-sm border-t border-gray-100 pt-4">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={form.atClientLocation}
              onChange={(e) => setForm((f) => ({ ...f, atClientLocation: e.target.checked }))}
            />
            <span>
              <span className="block text-gray-700 font-medium">El servicio se realiza a domicilio</span>
              <span className="block text-xs text-gray-500">
                {form.atClientLocation
                  ? 'El prestador se traslada hasta la ubicacion del cliente.'
                  : 'El cliente debe acudir a la ubicacion del prestador.'}
              </span>
            </span>
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
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Publicar servicio'}
          </button>
        </form>
      </div>
    </div>
  )
}
