'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { API_BASE } from '@/lib/api'

export default function Header({ categories = [] }: { categories?: any[] }) {
  const [cartCount, setCartCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Get session ID and load cart
    let sessionId = localStorage.getItem('sessionId')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('sessionId', sessionId)
    }

    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)

    // Load cart count (use API_BASE so path is always /api/v1/cart)
    const headers: Record<string, string> = { 'X-Session-ID': sessionId }
    if (token) headers['Authorization'] = `Bearer ${token}`
    fetch(`${API_BASE}/cart`, { headers })
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          setCartCount(data.items.length)
        }
      })
      .catch(() => {})
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/products?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <header className="header">
      <div className="container" style={{ padding: '12px 16px' }}>
        {/* Top Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <Link href="/" style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4056' }}>
            فروشگاه پوشاک
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {isLoggedIn ? (
              <Link href="/profile">پروفایل</Link>
            ) : (
              <Link href="/login">ورود / ثبت‌نام</Link>
            )}
            <Link href="/cart" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>🛒</span>
              سبد خرید
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: '#ef4056',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 'bold',
                }}>
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ marginBottom: '12px' }}>
          <div className="search-box">
            <input
              type="text"
              placeholder="جستجو در محصولات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>
              جستجو
            </button>
          </div>
        </form>

        {/* Categories */}
        <nav style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
          <Link href="/products" style={{ whiteSpace: 'nowrap', color: '#232933', fontWeight: '500' }}>
            همه محصولات
          </Link>
          {(categories || []).slice(0, 8).map((cat: any) => (
            <Link key={cat.id} href={`/category/${cat.slug}`} style={{ whiteSpace: 'nowrap', color: '#232933' }}>
              {cat.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
