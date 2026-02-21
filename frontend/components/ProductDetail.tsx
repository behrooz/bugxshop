'use client'

import { useState, useEffect, useMemo } from 'react'
import { addToCart } from '@/lib/api'
import { getProductGalleryImages } from '@/lib/productImage'

export default function ProductDetail({ product }: { product: any }) {
  const [sessionId, setSessionId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [message, setMessage] = useState('')
  const galleryImages = useMemo(() => getProductGalleryImages(product), [product])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const currentImage = galleryImages[selectedIndex] || galleryImages[0]
  const hasMultiple = galleryImages.length > 1
  useEffect(() => {
    setSelectedIndex(0)
  }, [product?.id])

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

  const title = product.name || product.name_en || product.display_name

  const goPrev = () => setSelectedIndex((i) => (i <= 0 ? galleryImages.length - 1 : i - 1))
  const goNext = () => setSelectedIndex((i) => (i >= galleryImages.length - 1 ? 0 : i + 1))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
      <div>
        <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', background: '#f5f5f5' }}>
          <img
            src={currentImage?.url}
            alt={currentImage?.alt_text || title}
            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
          />
          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="قبلی"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(255,255,255,0.9)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  fontSize: '20px',
                }}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="بعدی"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(255,255,255,0.9)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  fontSize: '20px',
                }}
              >
                ›
              </button>
            </>
          )}
        </div>
        {hasMultiple && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
            {galleryImages.map((img, i) => (
              <button
                key={img.id ?? i}
                type="button"
                onClick={() => setSelectedIndex(i)}
                style={{
                  flexShrink: 0,
                  width: '64px',
                  height: '64px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: selectedIndex === i ? '2px solid #ef4056' : '2px solid transparent',
                  padding: 0,
                  cursor: 'pointer',
                  background: '#f0f0f0',
                }}
              >
                <img
                  src={img.thumbnail_url || img.url}
                  alt={img.alt_text || ''}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>{product.name || product.name_en || product.display_name}</h1>
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
        <p style={{ marginBottom: '20px', lineHeight: '1.8', color: '#666' }}>{product.description || product.short_description || product.display_description}</p>
        
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

