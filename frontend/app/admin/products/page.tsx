'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API_URL = 'http://localhost:8080/api/v1'

export default function AdminProducts() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    checkAuth()
    loadProducts()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login?redirect=/admin/products')
      return
    }
    // Verify admin access
    try {
      const response = await fetch(`${API_URL}/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (!response.ok) {
        router.push('/login')
        return
      }
    } catch {
      router.push('/login')
    }
  }

  const loadProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`)
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این محصول اطمینان دارید؟')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (response.ok) {
        loadProducts()
      } else {
        alert('خطا در حذف محصول')
      }
    } catch (error) {
      alert('خطا در حذف محصول')
    }
  }

  const filteredProducts = products.filter((p: any) =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
      <aside style={{
        width: '250px',
        background: '#232933',
        color: 'white',
        padding: '20px 0',
        position: 'fixed',
        height: '100vh',
      }}>
        <div style={{ padding: '0 20px', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '20px' }}>پنل مدیریت</h2>
        </div>
        <nav>
          <Link href="/admin" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>📊 داشبورد</Link>
          <Link href="/admin/products" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none', background: 'rgba(239, 64, 86, 0.1)', borderRight: '3px solid #ef4056' }}>🛍️ محصولات</Link>
          <Link href="/admin/categories" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>📁 دسته‌بندی‌ها</Link>
          <Link href="/admin/brands" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>🏷️ برندها</Link>
          <Link href="/admin/orders" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>📦 سفارش‌ها</Link>
          <Link href="/admin/reviews" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>⭐ نظرات</Link>
          <Link href="/admin/discounts" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>🎫 تخفیف‌ها</Link>
          <Link href="/admin/analytics" style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>📈 گزارش‌ها</Link>
          <Link href="/" style={{ display: 'block', padding: '12px 20px', color: '#a1a3a8', textDecoration: 'none', marginTop: '20px', borderTop: '1px solid #3a3f4a' }}>← بازگشت</Link>
        </nav>
      </aside>

      <main style={{ marginRight: '250px', flex: 1, padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px' }}>مدیریت محصولات</h1>
          <Link href="/admin/products/new" className="btn btn-primary">+ افزودن محصول</Link>
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="جستجو محصول..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <button className="btn btn-secondary">جستجو</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>در حال بارگذاری...</div>
        ) : (
          <div className="card">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px', textAlign: 'right' }}>ID</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>نام</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>SKU</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>قیمت</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>موجودی</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>وضعیت</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product: any) => (
                  <tr key={product.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{product.id}</td>
                    <td style={{ padding: '12px' }}>{product.name}</td>
                    <td style={{ padding: '12px' }}>{product.sku}</td>
                    <td style={{ padding: '12px' }}>
                      {new Intl.NumberFormat('fa-IR').format(product.base_price || product.price)} تومان
                    </td>
                    <td style={{ padding: '12px' }}>{product.stock}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        background: product.status === 'active' ? '#d4edda' : '#f8d7da',
                        color: product.status === 'active' ? '#155724' : '#721c24',
                      }}>
                        {product.status === 'active' ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link href={`/admin/products/${product.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                          ویرایش
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="btn"
                          style={{ padding: '6px 12px', fontSize: '12px', background: '#dc3545', color: 'white', border: 'none' }}
                        >
                          حذف
                        </button>
                      </div>
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

