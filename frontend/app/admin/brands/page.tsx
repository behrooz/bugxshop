'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

export default function AdminBrands() {
  const router = useRouter()
  const [brands, setBrands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', name_en: '', slug: '', description: '' })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login?redirect=/admin/brands')
      return
    }
    loadBrands()
  }, [])

  const loadBrands = async () => {
    try {
      const response = await fetch(`${API_URL}/brands`)
      const data = await response.json()
      setBrands(data.brands || data || [])
    } catch (error) {
      console.error('Error loading brands:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_URL}/admin/brands`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          name_en: formData.name_en || undefined,
          slug: formData.slug || formData.name_en?.toLowerCase().replace(/\s+/g, '-') || '',
          description: formData.description || '',
        }),
      })
      if (res.ok) {
        setShowForm(false)
        setFormData({ name: '', name_en: '', slug: '', description: '' })
        loadBrands()
      } else {
        const err = await res.json()
        alert(err.error || 'خطا در ایجاد')
      }
    } catch {
      alert('خطا در ارتباط با سرور')
    }
  }

  const sidebar = (
    <aside style={{ width: '250px', background: '#232933', color: 'white', padding: '20px 0', position: 'fixed', height: '100vh' }}>
      <div style={{ padding: '0 20px', marginBottom: '30px' }}><h2>پنل مدیریت</h2></div>
      <nav>
        <Link href="/admin" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>📊 داشبورد</Link>
        <Link href="/admin/products" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>🛍️ محصولات</Link>
        <Link href="/admin/categories" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>📁 دسته‌بندی‌ها</Link>
        <Link href="/admin/brands" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none', background: 'rgba(239, 64, 86, 0.1)', borderRight: '3px solid #ef4056' }}>🏷️ برندها</Link>
        <Link href="/admin/orders" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>📦 سفارش‌ها</Link>
        <Link href="/admin/reviews" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>⭐ نظرات</Link>
        <Link href="/admin/discounts" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>🎫 تخفیف‌ها</Link>
        <Link href="/admin/analytics" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>📈 گزارش‌ها</Link>
        <Link href="/" style={{ display: 'block', padding: '12px 20px', color: '#a1a3a8', textDecoration: 'none', marginTop: '20px', borderTop: '1px solid #3a3f4a' }}>← بازگشت</Link>
      </nav>
    </aside>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
      {sidebar}
      <main style={{ marginRight: '250px', flex: 1, padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px' }}>برندها</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">+ افزودن برند</button>
        </div>
        {showForm && (
          <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px', maxWidth: '400px' }}>
              <input type="text" required placeholder="نام برند" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
              <input type="text" placeholder="نام انگلیسی" value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
              <input type="text" placeholder="slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
              <input type="text" placeholder="توضیحات" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary">ذخیره</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">انصراف</button>
              </div>
            </form>
          </div>
        )}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>در حال بارگذاری...</div>
        ) : (
          <div className="card">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px', textAlign: 'right' }}>شناسه</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>نام</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>نام انگلیسی</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>slug</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(brands) ? brands : []).map((b: any) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{b.id}</td>
                    <td style={{ padding: '12px' }}>{b.name}</td>
                    <td style={{ padding: '12px' }}>{b.name_en || '-'}</td>
                    <td style={{ padding: '12px' }}>{b.slug}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
