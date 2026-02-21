'use client'

import { useState, useEffect } from 'react'
import { getCart, createOrder, API_BASE } from '@/lib/api'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getCategories } from '@/lib/api'
import { getProductImageUrl } from '@/lib/productImage'

export default function CartPage() {
  const [cart, setCart] = useState<any>({ items: [], total: 0 })
  const [sessionId, setSessionId] = useState('')
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [checkout, setCheckout] = useState(false)
  const [formData, setFormData] = useState({
    customer_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'ایران',
  })
  const formatPrice = (p: number) => new Intl.NumberFormat('fa-IR').format(p)

  useEffect(() => {
    let id = localStorage.getItem('sessionId')
    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('sessionId', id)
    }
    setSessionId(id)
    loadCart(id)
    loadCategories()
  }, [])

  const loadCart = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/cart`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Session-ID': id,
        },
      })
      const data = await response.json()
      setCart(data)
    } catch (error) {
      console.error('Error loading cart:', error)
      setCart({ items: [], total: 0 })
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const cats = await getCategories()
      setCategories(cats)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createOrder({
        session_id: sessionId,
        ...formData,
      })
      alert('سفارش با موفقیت ثبت شد.')
      setCart({ items: [], total: 0 })
      setCheckout(false)
    } catch (error: any) {
      alert('خطا در ثبت سفارش: ' + (error.response?.data?.error || error.message))
    }
  }

  if (loading) {
    return (
      <>
        <Header categories={categories} />
        <main style={{ padding: '40px 0', minHeight: '60vh' }}>
          <div className="container" style={{ textAlign: 'center', color: '#666' }}>در حال بارگذاری...</div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header categories={categories} />
      <main style={{ padding: '40px 0', minHeight: '60vh' }}>
        <div className="container">
          <h1 style={{ fontSize: '28px' }}>سبد خرید</h1>
          {cart.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p>سبد خرید شما خالی است.</p>
            </div>
          ) : (
            <>
              <div style={{ marginTop: '30px' }}>
                {cart.items.map((item: any) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      gap: '20px',
                      padding: '20px',
                      borderBottom: '1px solid #e0e0e0',
                    }}
                  >
                    <img
                      src={getProductImageUrl(item.product, 100, 100)}
                      alt={item.product.name}
                      style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1 }}>
                      <h3>{item.product.name}</h3>
                      <p>تعداد: {formatPrice(item.quantity)}</p>
                      <p>قیمت: {formatPrice(item.product.price)} تومان</p>
                    </div>
                    <div>
                      <strong>{formatPrice(item.item_total)} تومان</strong>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: '30px',
                padding: '20px',
                background: '#f5f5f5',
                borderRadius: '8px',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '24px',
                  fontWeight: 'bold',
                }}>
                  <span>جمع کل:</span>
                  <span>{formatPrice(cart.total)} تومان</span>
                </div>
                <button
                  onClick={() => setCheckout(true)}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '20px' }}
                >
                  ادامه و پرداخت
                </button>
              </div>

              {checkout && (
                <div style={{
                  marginTop: '30px',
                  padding: '30px',
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                }}>
                  <h2>تکمیل خرید</h2>
                  <form onSubmit={handleCheckout}>
                    <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
                      <input
                        type="text"
                        placeholder="نام و نام خانوادگی"
                        required
                        value={formData.customer_name}
                        onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                        style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                      <input
                        type="email"
                        placeholder="ایمیل"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                      <input
                        type="tel"
                        placeholder="تلفن"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                      <input
                        type="text"
                        placeholder="آدرس"
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <input
                          type="text"
                          placeholder="شهر"
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                        <input
                          type="text"
                          placeholder="استان"
                          required
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <input
                          type="text"
                          placeholder="کد پستی"
                          required
                          value={formData.zip_code}
                          onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                          style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                        <input
                          type="text"
                          placeholder="کشور"
                          required
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        ثبت سفارش
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

