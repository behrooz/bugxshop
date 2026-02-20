'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API_URL = 'http://localhost:8080/api/v1'

export default function AdminAnalytics() {
  const router = useRouter()
  const [salesData, setSalesData] = useState<any[]>([])
  const [productsData, setProductsData] = useState<any[]>([])
  const [usersData, setUsersData] = useState<any>({})
  const [period, setPeriod] = useState('daily')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
    loadAnalytics()
  }, [period])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login?redirect=/admin/analytics')
      return
    }
  }

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const [sales, products, users] = await Promise.all([
        fetch(`${API_URL}/admin/analytics/sales?period=${period}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_URL}/admin/analytics/products`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_URL}/admin/analytics/users`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ])

      const salesRes = await sales.json()
      const productsRes = await products.json()
      const usersRes = await users.json()

      setSalesData(salesRes.reports || [])
      setProductsData(productsRes.products || [])
      setUsersData(usersRes)
    } catch (error) {
      console.error('Error loading analytics:', error)
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
          <Link href="/admin/discounts" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>🎫 تخفیف‌ها</Link>
          <Link href="/admin/analytics" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none', background: 'rgba(239, 64, 86, 0.1)', borderRight: '3px solid #ef4056' }}>📈 گزارش‌ها</Link>
          <Link href="/" style={{ display: 'block', padding: '12px 20px', color: '#a1a3a8', textDecoration: 'none', marginTop: '20px', borderTop: '1px solid #3a3f4a' }}>← بازگشت</Link>
        </nav>
      </aside>

      <main style={{ marginRight: '250px', flex: 1, padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px' }}>گزارش‌گیری و آنالیتیکس</h1>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="daily">روزانه</option>
            <option value="weekly">هفتگی</option>
            <option value="monthly">ماهانه</option>
          </select>
        </div>

        {/* User Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>کل کاربران</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{usersData.total_users || 0}</div>
          </div>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>کاربران با سفارش</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{usersData.users_with_orders || 0}</div>
          </div>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>کاربران فعال (30 روز)</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{usersData.active_users_30d || 0}</div>
          </div>
        </div>

        {/* Sales Report */}
        <div className="card" style={{ padding: '24px', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>گزارش فروش</h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>در حال بارگذاری...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px', textAlign: 'right' }}>دوره</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>تعداد سفارش</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>درآمد</th>
                </tr>
              </thead>
              <tbody>
                {salesData.map((item: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{item.period}</td>
                    <td style={{ padding: '12px' }}>{item.orders}</td>
                    <td style={{ padding: '12px' }}>
                      {item.revenue ? new Intl.NumberFormat('fa-IR').format(item.revenue) : 0} تومان
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Top Products */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>محصولات پرفروش</h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>در حال بارگذاری...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px', textAlign: 'right' }}>محصول</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>SKU</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>تعداد فروش</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>درآمد</th>
                </tr>
              </thead>
              <tbody>
                {productsData.slice(0, 10).map((product: any) => (
                  <tr key={product.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{product.name}</td>
                    <td style={{ padding: '12px' }}>{product.sku}</td>
                    <td style={{ padding: '12px' }}>{product.sold_count || 0}</td>
                    <td style={{ padding: '12px' }}>
                      {product.revenue ? new Intl.NumberFormat('fa-IR').format(product.revenue) : 0} تومان
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}

