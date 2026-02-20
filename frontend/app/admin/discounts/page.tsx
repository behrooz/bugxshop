'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API_URL = 'http://localhost:8080/api/v1'

export default function AdminDiscounts() {
  const router = useRouter()
  const [discounts, setDiscounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    checkAuth()
    loadDiscounts()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login?redirect=/admin/discounts')
      return
    }
  }

  const loadDiscounts = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/admin/discounts`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const data = await response.json()
      setDiscounts(data.discounts || [])
    } catch (error) {
      console.error('Error loading discounts:', error)
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
          <Link href="/admin" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>📊 داشبورد</Link>
          <Link href="/admin/products" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>🛍️ محصولات</Link>
          <Link href="/admin/categories" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>📁 دسته‌بندی‌ها</Link>
          <Link href="/admin/brands" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>🏷️ برندها</Link>
          <Link href="/admin/orders" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>📦 سفارش‌ها</Link>
          <Link href="/admin/reviews" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>⭐ نظرات</Link>
          <Link href="/admin/discounts" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none', background: 'rgba(239, 64, 86, 0.1)', borderRight: '3px solid #ef4056' }}>🎫 تخفیف‌ها</Link>
          <Link href="/admin/analytics" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>📈 گزارش‌ها</Link>
          <Link href="/" style={{ display: 'block', padding: '12px 20px', color: '#a1a3a8', textDecoration: 'none', marginTop: '20px', borderTop: '1px solid #3a3f4a' }}>← بازگشت</Link>
        </nav>
      </aside>

      <main style={{ marginRight: '250px', flex: 1, padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px' }}>مدیریت تخفیف‌ها</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            + ایجاد تخفیف جدید
          </button>
        </div>

        {showForm && <DiscountForm onClose={() => { setShowForm(false); loadDiscounts(); }} />}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>در حال بارگذاری...</div>
        ) : (
          <div className="card">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px', textAlign: 'right' }}>کد</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>عنوان</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>نوع</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>مقدار</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>استفاده</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>وضعیت</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((discount: any) => (
                  <tr key={discount.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{discount.code || '-'}</td>
                    <td style={{ padding: '12px' }}>{discount.title}</td>
                    <td style={{ padding: '12px' }}>
                      {discount.type === 'percentage' ? 'درصدی' : discount.type === 'fixed' ? 'مبلغ ثابت' : 'ارسال رایگان'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {discount.type === 'percentage' ? `${discount.value}%` : `${new Intl.NumberFormat('fa-IR').format(discount.value)} تومان`}
                    </td>
                    <td style={{ padding: '12px' }}>{discount.usage_count || 0}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        background: discount.is_active ? '#d4edda' : '#f8d7da',
                        color: discount.is_active ? '#155724' : '#721c24',
                      }}>
                        {discount.is_active ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Link href={`/admin/discounts/${discount.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                        ویرایش
                      </Link>
                    </td>
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

function DiscountForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    type: 'percentage',
    value: '',
    min_purchase: '',
    usage_limit: '',
    starts_at: '',
    ends_at: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/admin/discounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          value: parseFloat(formData.value),
          min_purchase: formData.min_purchase ? parseFloat(formData.min_purchase) : null,
          usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
          starts_at: formData.starts_at || null,
          ends_at: formData.ends_at || null,
        }),
      })

      if (response.ok) {
        onClose()
      } else {
        const error = await response.json()
        alert(error.error || 'خطا در ایجاد تخفیف')
      }
    } catch (error) {
      alert('خطا در ایجاد تخفیف')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
      <h3 style={{ marginBottom: '20px' }}>ایجاد تخفیف جدید</h3>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>کد تخفیف</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>عنوان *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>نوع تخفیف *</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="percentage">درصدی</option>
            <option value="fixed">مبلغ ثابت</option>
            <option value="free_shipping">ارسال رایگان</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>مقدار *</label>
            <input
              type="number"
              required
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>حداقل خرید (تومان)</label>
            <input
              type="number"
              value={formData.min_purchase}
              onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>شروع</label>
            <input
              type="datetime-local"
              value={formData.starts_at}
              onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>پایان</label>
            <input
              type="datetime-local"
              value={formData.ends_at}
              onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'در حال ذخیره...' : 'ذخیره'}
          </button>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            انصراف
          </button>
        </div>
      </form>
    </div>
  )
}

