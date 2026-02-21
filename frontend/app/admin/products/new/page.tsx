'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { categoriesToTreeOptions, categoryOptionLabel } from '@/lib/categories'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

export default function NewProduct() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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

  useEffect(() => {
    fetch(`${API_URL}/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/admin/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          base_price: parseFloat(formData.base_price),
          sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
          stock: parseInt(formData.stock),
          brand_id: formData.brand_id ? parseInt(formData.brand_id) : null,
          category_id: formData.category_id ? parseInt(formData.category_id) : null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/admin/products/${data.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'خطا در ایجاد محصول')
      }
    } catch (error) {
      alert('خطا در ایجاد محصول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
      <aside style={{ width: '250px', background: '#232933', color: 'white', padding: '20px 0', position: 'fixed', height: '100vh' }}>
        <div style={{ padding: '0 20px', marginBottom: '30px' }}>
          <h2>پنل مدیریت</h2>
        </div>
        <nav>
          <Link href="/admin/products" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>← بازگشت</Link>
        </nav>
      </aside>

      <main style={{ marginRight: '250px', flex: 1, padding: '30px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '30px' }}>افزودن محصول جدید</h1>

        <form onSubmit={handleSubmit} className="card" style={{ padding: '30px', maxWidth: '800px' }}>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>نام محصول *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>نام انگلیسی</label>
              <input
                type="text"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>توضیحات</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px' }}>SKU *</label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px' }}>وضعیت</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
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
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px' }}>قیمت فروش (تومان)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                  style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px' }}>موجودی *</label>
                <input
                  type="number"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px' }}>دسته‌بندی</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">— انتخاب دسته‌بندی —</option>
                  {categoriesToTreeOptions(categories).map((c) => (
                    <option key={c.id} value={c.id}>{categoryOptionLabel(c.name, c.depth)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>برند ID</label>
              <input
                type="number"
                value={formData.brand_id}
                onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'در حال ذخیره...' : 'ذخیره محصول'}
              </button>
              <Link href="/admin/products" className="btn btn-secondary">
                انصراف
              </Link>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}

