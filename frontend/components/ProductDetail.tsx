'use client'

import { useState, useEffect } from 'react'
import { addToCart } from '@/lib/api'

export default function ProductDetail({ product }: { product: any }) {
  const [sessionId, setSessionId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let id = localStorage.getItem('sessionId')
    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('sessionId', id)
    }
    setSessionId(id)
  }, [])

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('fa-IR').format(p)
  }

  const handleAddToCart = async () => {
    setAdding(true)
    setMessage('')
    try {
      await addToCart(product.id, quantity)
      setMessage('به سبد خرید اضافه شد!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'خطا در افزودن به سبد خرید')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
      <div>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.display_name || product.name_en || product.name}
            style={{ width: '100%', borderRadius: '8px' }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '500px',
            background: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
          }}>
            No Image
          </div>
        )}
      </div>
      <div>
        <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>{product.display_name || product.name_en || product.name}</h1>
        <div style={{ marginBottom: '20px' }}>
          {product.sale_price && product.sale_price < product.base_price ? (
            <div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4056' }}>
                {formatPrice(product.sale_price)} <span style={{ fontSize: '16px' }}>تومان</span>
              </div>
              <div style={{ fontSize: '18px', color: '#a1a3a8', textDecoration: 'line-through', marginTop: '8px' }}>
                {formatPrice(product.base_price)} تومان
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
              {formatPrice(product.base_price || product.price)} <span style={{ fontSize: '16px' }}>تومان</span>
            </div>
          )}
        </div>
        <p style={{ marginBottom: '20px', lineHeight: '1.8', color: '#666' }}>{product.display_description || product.short_description || product.description}</p>
        
        {product.rating_average > 0 && (
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="rating">
              {'★'.repeat(Math.round(product.rating_average))}
            </span>
            <span style={{ color: '#666' }}>({product.rating_count} نظر)</span>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <strong>موجودی:</strong> {product.stock > 0 ? `${product.stock} عدد موجود` : 'ناموجود'}
        </div>

        {product.stock > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>تعداد:</span>
              <input
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                style={{
                  padding: '8px',
                  width: '80px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
            </label>
          </div>
        )}

        {product.stock > 0 ? (
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '10px' }}
          >
            {adding ? 'در حال افزودن...' : 'افزودن به سبد خرید'}
          </button>
        ) : (
          <button disabled className="btn btn-secondary" style={{ width: '100%' }}>
            ناموجود
          </button>
        )}

        {message && (
          <div style={{
            padding: '10px',
            background: message.includes('خطا') ? '#fee' : '#efe',
            color: message.includes('خطا') ? '#c00' : '#0c0',
            borderRadius: '4px',
            marginTop: '10px',
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}

