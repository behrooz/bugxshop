'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API_URL = 'http://localhost:8080/api/v1'

export default function AdminOrders() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    checkAuth()
    loadOrders()
  }, [statusFilter])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login?redirect=/admin/orders')
      return
    }
  }

  const loadOrders = async () => {
    try {
      const token = localStorage.getItem('token')
      const url = `${API_URL}/admin/orders${statusFilter ? `?status=${statusFilter}` : ''}`
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (orderId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (response.ok) {
        loadOrders()
      }
    } catch (error) {
      alert('خطا در به‌روزرسانی')
    }
  }

  const statusLabels: any = {
    pending: 'در انتظار پرداخت',
    confirmed: 'تایید شده',
    processing: 'در حال پردازش',
    shipped: 'ارسال شده',
    delivered: 'تحویل داده شده',
    cancelled: 'لغو شده',
    returned: 'مرجوع شده',
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
          <Link href="/admin/orders" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none', background: 'rgba(239, 64, 86, 0.1)', borderRight: '3px solid #ef4056' }}>📦 سفارش‌ها</Link>
          <Link href="/admin/reviews" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>⭐ نظرات</Link>
          <Link href="/admin/discounts" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>🎫 تخفیف‌ها</Link>
          <Link href="/admin/analytics" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>📈 گزارش‌ها</Link>
          <Link href="/" style={{ display: 'block', padding: '12px 20px', color: '#a1a3a8', textDecoration: 'none', marginTop: '20px', borderTop: '1px solid #3a3f4a' }}>← بازگشت</Link>
        </nav>
      </aside>

      <main style={{ marginRight: '250px', flex: 1, padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px' }}>مدیریت سفارش‌ها</h1>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="pending">در انتظار پرداخت</option>
            <option value="confirmed">تایید شده</option>
            <option value="processing">در حال پردازش</option>
            <option value="shipped">ارسال شده</option>
            <option value="delivered">تحویل داده شده</option>
            <option value="cancelled">لغو شده</option>
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>در حال بارگذاری...</div>
        ) : (
          <div className="card">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px', textAlign: 'right' }}>شماره سفارش</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>مبلغ</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>وضعیت</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>پرداخت</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>تاریخ</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{order.order_number || `#${order.id}`}</td>
                    <td style={{ padding: '12px' }}>
                      {new Intl.NumberFormat('fa-IR').format(order.total)} تومان
                    </td>
                    <td style={{ padding: '12px' }}>
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        style={{ padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                      >
                        {Object.entries(statusLabels).map(([key, label]) => (
                          <option key={key} value={key}>{label as string}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        background: order.payment_status === 'paid' ? '#d4edda' : '#f8d7da',
                        color: order.payment_status === 'paid' ? '#155724' : '#721c24',
                      }}>
                        {order.payment_status === 'paid' ? 'پرداخت شده' : 'در انتظار'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {new Date(order.created_at).toLocaleDateString('fa-IR')}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Link href={`/admin/orders/${order.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                        جزئیات
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

