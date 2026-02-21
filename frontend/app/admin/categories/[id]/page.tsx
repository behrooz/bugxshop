'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

export default function AdminEditCategory() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [category, setCategory] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', name_en: '', slug: '', description: '', image_url: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push(`/login?redirect=/admin/categories/${id}`)
      return
    }
    loadCategory()
  }, [id])

  const loadCategory = async () => {
    if (!id) return
    try {
      const res = await fetch(`${API_URL}/categories/${id}`)
      if (!res.ok) {
        setCategory(null)
        return
      }
      const data = await res.json()
      setCategory(data)
      setFormData({
        name: data.name || '',
        name_en: data.name_en || '',
        slug: data.slug || '',
        description: data.description || '',
        image_url: data.image_url || '',
      })
    } catch {
      setCategory(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_URL}/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          name_en: formData.name_en || undefined,
          slug: formData.slug,
          description: formData.description || undefined,
          image_url: formData.image_url || undefined,
        }),
      })
      if (res.ok) {
        alert('دسته‌بندی به‌روزرسانی شد')
        loadCategory()
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

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const token = localStorage.getItem('token')
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch(`${API_URL}/admin/categories/${id}/image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form,
      })
      if (res.ok) {
        const data = await res.json()
        setFormData((f) => ({ ...f, image_url: data.url || '' }))
        loadCategory()
      } else {
        const err = await res.json()
        alert(err.error || 'خطا در آپلود')
      }
    } catch {
      alert('خطا در ارتباط با سرور')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5', alignItems: 'center', justifyContent: 'center' }}>
        در حال بارگذاری...
      </div>
    )
  }
  if (!category) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>دسته‌بندی یافت نشد</p>
        <Link href="/admin/categories" className="btn btn-primary" style={{ marginTop: '16px' }}>بازگشت به لیست</Link>
      </div>
    )
  }

  const sidebar = (
    <aside style={{ width: '250px', background: '#232933', color: 'white', padding: '20px 0', position: 'fixed', height: '100vh' }}>
      <div style={{ padding: '0 20px', marginBottom: '30px' }}><h2>پنل مدیریت</h2></div>
      <nav>
        <Link href="/admin" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>📊 داشبورد</Link>
        <Link href="/admin/products" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>🛍️ محصولات</Link>
        <Link href="/admin/categories" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none', background: 'rgba(239, 64, 86, 0.1)', borderRight: '3px solid #ef4056' }}>📁 دسته‌بندی‌ها</Link>
        <Link href="/admin/brands" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>🏷️ برندها</Link>
        <Link href="/admin/categories" style={{ display: 'block', padding: '12px 20px', color: '#a1a3a8', textDecoration: 'none', marginTop: '20px', borderTop: '1px solid #3a3f4a' }}>← بازگشت به دسته‌بندی‌ها</Link>
      </nav>
    </aside>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
      {sidebar}
      <main style={{ marginRight: '250px', flex: 1, padding: '30px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '30px' }}>ویرایش دسته‌بندی: {category.name}</h1>
        <div className="card" style={{ padding: '30px', maxWidth: '600px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>تصویر دسته‌بندی</label>
              {formData.image_url && (
                <img src={formData.image_url} alt="" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }} />
              )}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={uploadImage}
                  style={{ display: 'none' }}
                />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn btn-primary">
                  {uploading ? 'در حال آپلود...' : 'آپلود تصویر'}
                </button>
                <span style={{ color: '#666', fontSize: '14px' }}>یا</span>
                <input
                  type="url"
                  placeholder="آدرس تصویر"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  style={{ flex: 1, minWidth: '200px', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>نام *</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>نام انگلیسی</label>
              <input type="text" value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>slug *</label>
              <input type="text" required value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>توضیحات</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'در حال ذخیره...' : 'ذخیره'}</button>
              <Link href="/admin/categories" className="btn btn-secondary">انصراف</Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
