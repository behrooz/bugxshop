'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API_URL = 'http://localhost:8080/api/v1'

export default function AdminDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>({})

  useEffect(() => {
    checkAuth()
    loadStats()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login?redirect=/admin')
      return
    }

    try {
      const response = await fetch(`${API_URL}/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (response.ok) {
        const user = await response.json()
        if (user.is_admin) {
          setIsAuthenticated(true)
        } else {
          router.push('/')
        }
      } else {
        router.push('/login?redirect=/admin')
      }
    } catch (error) {
      router.push('/login?redirect=/admin')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const [sales, products, users] = await Promise.all([
        fetch(`${API_URL}/admin/analytics/sales?period=daily`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_URL}/admin/analytics/products`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_URL}/admin/analytics/users`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ])

      const salesData = await sales.json()
      const productsData = await products.json()
      const usersData = await users.json()

      setStats({
        sales: salesData,
        products: productsData,
        users: usersData,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>در حال بارگذاری...</div>
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Sidebar */}
      <aside style={{
        width: '250px',
        background: '#232933',
        color: 'white',
        padding: '20px 0',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto',
      }}>
        <div style={{ padding: '0 20px', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>پنل مدیریت</h2>
        </div>
        <nav>
          <Link href="/admin" style={{
            display: 'block',
            padding: '12px 20px',
            color: 'white',
            textDecoration: 'none',
            borderRight: '3px solid #ef4056',
            background: 'rgba(239, 64, 86, 0.1)',
          }}>
            📊 داشبورد
          </Link>
          <Link href="/admin/products" style={{
            display: 'block',
            padding: '12px 20px',
            color: 'white',
            textDecoration: 'none',
          }}>
            🛍️ محصولات
          </Link>
          <Link href="/admin/categories" style={{
            display: 'block',
            padding: '12px 20px',
            color: 'white',
            textDecoration: 'none',
          }}>
            📁 دسته‌بندی‌ها
          </Link>
          <Link href="/admin/brands" style={{
            display: 'block',
            padding: '12px 20px',
            color: 'white',
            textDecoration: 'none',
          }}>
            🏷️ برندها
          </Link>
          <Link href="/admin/orders" style={{
            display: 'block',
            padding: '12px 20px',
            color: 'white',
            textDecoration: 'none',
          }}>
            📦 سفارش‌ها
          </Link>
          <Link href="/admin/reviews" style={{
            display: 'block',
            padding: '12px 20px',
            color: 'white',
            textDecoration: 'none',
          }}>
            ⭐ نظرات
          </Link>
          <Link href="/admin/discounts" style={{
            display: 'block',
            padding: '12px 20px',
            color: 'white',
            textDecoration: 'none',
          }}>
            🎫 تخفیف‌ها
          </Link>
          <Link href="/admin/analytics" style={{
            display: 'block',
            padding: '12px 20px',
            color: 'white',
            textDecoration: 'none',
          }}>
            📈 گزارش‌ها
          </Link>
          <Link href="/" style={{
            display: 'block',
            padding: '12px 20px',
            color: '#a1a3a8',
            textDecoration: 'none',
            marginTop: '20px',
            borderTop: '1px solid #3a3f4a',
          }}>
            ← بازگشت به سایت
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ marginRight: '250px', flex: 1, padding: '30px' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>داشبورد مدیریت</h1>
          <p style={{ color: '#666' }}>خلاصه آمار و گزارش‌های فروشگاه</p>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px',
        }}>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>کل کاربران</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {stats.users?.total_users || 0}
            </div>
          </div>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>سفارش‌ها</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {stats.users?.users_with_orders || 0}
            </div>
          </div>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>محصولات</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {stats.products?.products?.length || 0}
            </div>
          </div>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>کاربران فعال (30 روز)</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {stats.users?.active_users_30d || 0}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ padding: '24px', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>عملیات سریع</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/admin/products/new" className="btn btn-primary">
              + افزودن محصول جدید
            </Link>
            <Link href="/admin/categories/new" className="btn btn-secondary">
              + افزودن دسته‌بندی
            </Link>
            <Link href="/admin/brands/new" className="btn btn-secondary">
              + افزودن برند
            </Link>
            <Link href="/admin/discounts/new" className="btn btn-secondary">
              + ایجاد تخفیف
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px' }}>سفارش‌های اخیر</h2>
            <Link href="/admin/orders" style={{ color: '#ef4056' }}>مشاهده همه</Link>
          </div>
          <div style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
            در حال بارگذاری...
          </div>
        </div>
      </main>
    </div>
  )
}

