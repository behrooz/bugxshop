'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { categoriesToTreeOptions, categoryOptionLabel } from '@/lib/categories'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

export default function AdminEditProduct() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [product, setProduct] = useState<any>(null)
  const [categories, setCategories] = useState<{ id: number; name: string; parent_id?: number | null }[]>([])
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    description: '',
    short_description: '',
    sku: '',
    brand_id: '',
    category_id: '',
    base_price: '',
    sale_price: '',
    stock: '',
    status: 'active',
  })
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newImageAlt, setNewImageAlt] = useState('')
  const [newImagePrimary, setNewImagePrimary] = useState(false)
  const [addingImage, setAddingImage] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadPrimary, setUploadPrimary] = useState(false)
  const [uploadAlt, setUploadAlt] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push(`/login?redirect=/admin/products/${id}`)
      return
    }
    loadProduct()
    fetch(`${API_URL}/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {})
  }, [id])

  const loadProduct = async () => {
    if (!id) return
    try {
      const response = await fetch(`${API_URL}/products/${id}`)
      if (!response.ok) {
        setProduct(null)
        return
      }
      const data = await response.json()
      setProduct(data)
      setFormData({
        name: data.name || '',
        name_en: data.name_en || '',
        description: data.description || '',
        short_description: data.short_description || '',
        sku: data.sku || '',
        brand_id: data.brand_id ?? data.brand?.id ?? '',
        category_id: String(data.category_id ?? data.category?.id ?? ''),
        base_price: String(data.base_price ?? data.price ?? ''),
        sale_price: data.sale_price != null ? String(data.sale_price) : '',
        stock: String(data.stock ?? ''),
        status: data.status || 'active',
      })
    } catch (error) {
      console.error('Error loading product:', error)
    } finally {
      setLoading(false)
    }
  }

  const addImage = async () => {
    if (!newImageUrl.trim()) return
    setAddingImage(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_URL}/admin/products/${id}/media`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newImageUrl.trim(), alt_text: newImageAlt.trim() || undefined, is_primary: newImagePrimary }),
      })
      if (res.ok) {
        setNewImageUrl('')
        setNewImageAlt('')
        setNewImagePrimary(false)
        loadProduct()
      } else {
        const err = await res.json()
        alert(err.error || 'خطا در افزودن تصویر')
      }
    } catch {
      alert('خطا در ارتباط با سرور')
    } finally {
      setAddingImage(false)
    }
  }

  const setPrimaryImage = async (mediaId: number) => {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_URL}/admin/products/${id}/media/${mediaId}/primary`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } })
    if (res.ok) loadProduct()
    else alert('خطا')
  }

  const deleteImage = async (mediaId: number) => {
    if (!confirm('این تصویر حذف شود؟')) return
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_URL}/admin/products/${id}/media/${mediaId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
    if (res.ok) loadProduct()
    else alert('خطا در حذف')
  }

  const uploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setUploadingFile(true)
    const token = localStorage.getItem('token')
    const form = new FormData()
    for (let i = 0; i < files.length; i++) form.append('file', files[i])
    form.append('is_primary', uploadPrimary ? 'true' : 'false')
    if (uploadAlt.trim()) form.append('alt_text', uploadAlt.trim())
    try {
      const res = await fetch(`${API_URL}/admin/products/${id}/media/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form,
      })
      if (res.ok) {
        setUploadAlt('')
        setUploadPrimary(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
        loadProduct()
      } else {
        const err = await res.json()
        alert(err.error || 'خطا در آپلود')
      }
    } catch {
      alert('خطا در ارتباط با سرور')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_URL}/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          name_en: formData.name_en || undefined,
          description: formData.description || undefined,
          short_description: formData.short_description || undefined,
          sku: formData.sku,
          brand_id: formData.brand_id ? parseInt(formData.brand_id) : null,
          category_id: formData.category_id ? parseInt(formData.category_id) : null,
          base_price: parseFloat(formData.base_price),
          sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
          stock: parseInt(formData.stock) || 0,
          status: formData.status,
        }),
      })
      if (res.ok) {
        alert('محصول به‌روزرسانی شد')
        loadProduct()
      } else {
        const err = await res.json()
        alert(err.error || 'خطا در به‌روزرسانی')
      }
    } catch {
      alert('خطا در ارتباط با سرور')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5', alignItems: 'center', justifyContent: 'center' }}>
        در حال بارگذاری...
      </div>
    )
  }
  if (!product) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>محصول یافت نشد</p>
        <Link href="/admin/products" className="btn btn-primary" style={{ marginTop: '16px' }}>بازگشت به لیست</Link>
      </div>
    )
  }

  const sidebar = (
    <aside style={{ width: '250px', background: '#232933', color: 'white', padding: '20px 0', position: 'fixed', height: '100vh' }}>
      <div style={{ padding: '0 20px', marginBottom: '30px' }}><h2>پنل مدیریت</h2></div>
      <nav>
        <Link href="/admin" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>📊 داشبورد</Link>
        <Link href="/admin/products" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none', background: 'rgba(239, 64, 86, 0.1)', borderRight: '3px solid #ef4056' }}>🛍️ محصولات</Link>
        <Link href="/admin/categories" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>📁 دسته‌بندی‌ها</Link>
        <Link href="/admin/brands" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>🏷️ برندها</Link>
        <Link href="/admin/orders" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>📦 سفارش‌ها</Link>
        <Link href="/admin/reviews" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>⭐ نظرات</Link>
        <Link href="/admin/discounts" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>🎫 تخفیف‌ها</Link>
        <Link href="/admin/analytics" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>📈 گزارش‌ها</Link>
        <Link href="/admin/products" style={{ display: 'block', padding: '12px 20px', color: '#a1a3a8', textDecoration: 'none', marginTop: '20px', borderTop: '1px solid #3a3f4a' }}>← بازگشت به محصولات</Link>
        <Link href="/" style={{ display: 'block', padding: '12px 20px', color: '#a1a3a8', textDecoration: 'none' }}>بازگشت به سایت</Link>
      </nav>
    </aside>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
      {sidebar}
      <main style={{ marginRight: '250px', flex: 1, padding: '30px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '30px' }}>ویرایش محصول #{id}</h1>
        <form onSubmit={handleSubmit} className="card" style={{ padding: '30px', maxWidth: '800px' }}>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>نام محصول *</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>نام انگلیسی</label>
              <input type="text" value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>توضیحات</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>توضیح کوتاه</label>
              <textarea value={formData.short_description} onChange={(e) => setFormData({ ...formData, short_description: e.target.value })} rows={2} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px' }}>SKU *</label>
                <input type="text" required value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px' }}>وضعیت</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <option value="draft">پیش‌نویس</option>
                  <option value="active">فعال</option>
                  <option value="inactive">غیرفعال</option>
                  <option value="out_of_stock">ناموجود</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px' }}>قیمت پایه (تومان) *</label>
                <input type="number" required step="0.01" value={formData.base_price} onChange={(e) => setFormData({ ...formData, base_price: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px' }}>قیمت فروش (تومان)</label>
                <input type="number" step="0.01" value={formData.sale_price} onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px' }}>موجودی *</label>
                <input type="number" required value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px' }}>دسته‌بندی</label>
                <select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <option value="">— انتخاب دسته‌بندی —</option>
                  {categoriesToTreeOptions(categories).map((c) => (
                    <option key={c.id} value={c.id}>{categoryOptionLabel(c.name, c.depth)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>برند ID</label>
              <input type="number" value={formData.brand_id} onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '24px', marginTop: '8px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>تصاویر محصول</label>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>هر محصول می‌تواند چند تصویر داشته باشد. یکی را به‌عنوان تصویر اصلی انتخاب کنید. از کامپیوتر آپلود کنید یا با URL اضافه کنید.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                {(product.images || []).map((img: any) => (
                  <div key={img.id} style={{ width: '100px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', background: '#f9f9f9' }}>
                    <img src={img.url} alt={img.alt_text || ''} style={{ width: '100%', height: '80px', objectFit: 'cover' }} />
                    <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {img.is_primary && <span style={{ fontSize: '11px', color: '#2e7d32', fontWeight: 600 }}>اصلی</span>}
                      {!img.is_primary && (
                        <button type="button" onClick={() => setPrimaryImage(img.id)} style={{ fontSize: '11px', padding: '4px', cursor: 'pointer' }}>اصلی</button>
                      )}
                      <button type="button" onClick={() => deleteImage(img.id)} style={{ fontSize: '11px', padding: '4px', color: '#c62828', cursor: 'pointer' }}>حذف</button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>آپلود از دستگاه (JPEG, PNG, GIF, WebP — حداکثر ۱۰ مگابایت)</p>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    onChange={uploadFiles}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="btn btn-primary"
                    style={{ padding: '10px 20px' }}
                  >
                    {uploadingFile ? 'در حال آپلود...' : 'انتخاب و آپلود تصویر'}
                  </button>
                  <input
                    type="text"
                    placeholder="متن جایگزین (اختیاری)"
                    value={uploadAlt}
                    onChange={(e) => setUploadAlt(e.target.value)}
                    style={{ width: '160px', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={uploadPrimary} onChange={(e) => setUploadPrimary(e.target.checked)} />
                    تصویر اصلی
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', color: '#666' }}>یا با آدرس تصویر:</span>
                <input
                  type="url"
                  placeholder="آدرس تصویر (URL)"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  style={{ flex: '1', minWidth: '200px', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                <input
                  type="text"
                  placeholder="متن جایگزین (اختیاری)"
                  value={newImageAlt}
                  onChange={(e) => setNewImageAlt(e.target.value)}
                  style={{ width: '140px', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                  <input type="checkbox" checked={newImagePrimary} onChange={(e) => setNewImagePrimary(e.target.checked)} />
                  تصویر اصلی
                </label>
                <button type="button" onClick={addImage} disabled={addingImage || !newImageUrl.trim()} className="btn btn-secondary" style={{ padding: '10px 20px' }}>
                  {addingImage ? '...' : 'افزودن با URL'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</button>
              <Link href="/admin/products" className="btn btn-secondary">انصراف</Link>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
