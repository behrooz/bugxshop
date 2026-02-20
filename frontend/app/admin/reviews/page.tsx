'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API_URL = 'http://localhost:8080/api/v1'

export default function AdminReviews() {
  const router = useRouter()
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    checkAuth()
    loadReviews()
  }, [filter])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login?redirect=/admin/reviews')
      return
    }
  }

  const loadReviews = async () => {
    try {
      const token = localStorage.getItem('token')
      const url = `${API_URL}/admin/reviews${filter !== 'all' ? `?approved=${filter}` : ''}`
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const approveReview = async (reviewId: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/admin/reviews/${reviewId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (response.ok) {
        loadReviews()
      }
    } catch (error) {
      alert('خطا در تایید نظر')
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
          <Link href="/admin/reviews" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none', background: 'rgba(239, 64, 86, 0.1)', borderRight: '3px solid #ef4056' }}>⭐ نظرات</Link>
          <Link href="/admin/discounts" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>🎫 تخفیف‌ها</Link>
          <Link href="/admin/analytics" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>📈 گزارش‌ها</Link>
          <Link href="/" style={{ display: 'block', padding: '12px 20px', color: '#a1a3a8', textDecoration: 'none', marginTop: '20px', borderTop: '1px solid #3a3f4a' }}>← بازگشت</Link>
        </nav>
      </aside>

      <main style={{ marginRight: '250px', flex: 1, padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px' }}>مدیریت نظرات</h1>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="all">همه نظرات</option>
            <option value="true">تایید شده</option>
            <option value="false">در انتظار تایید</option>
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>در حال بارگذاری...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reviews.map((review: any) => (
              <div key={review.id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                      {'⭐'.repeat(review.rating)} {review.title || 'بدون عنوان'}
                    </div>
                    <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                      محصول ID: {review.product_id} | کاربر ID: {review.user_id}
                    </div>
                    {review.comment && (
                      <p style={{ marginTop: '12px', lineHeight: '1.8' }}>{review.comment}</p>
                    )}
                  </div>
                  <div>
                    {!review.is_approved && (
                      <button
                        onClick={() => approveReview(review.id)}
                        className="btn btn-primary"
                        style={{ padding: '8px 16px', fontSize: '14px' }}
                      >
                        تایید
                      </button>
                    )}
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      background: review.is_approved ? '#d4edda' : '#fff3cd',
                      color: review.is_approved ? '#155724' : '#856404',
                      marginRight: '8px',
                    }}>
                      {review.is_approved ? 'تایید شده' : 'در انتظار'}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {new Date(review.created_at).toLocaleDateString('fa-IR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

