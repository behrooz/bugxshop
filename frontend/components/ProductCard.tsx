import Link from 'next/link'

export default function ProductCard({ product }: { product: any }) {
  const price = product.sale_price || product.base_price || product.price
  const hasDiscount = product.sale_price && product.sale_price < product.base_price
  const discountPercent = hasDiscount 
    ? Math.round(((product.base_price - product.sale_price) / product.base_price) * 100)
    : 0

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('fa-IR').format(p)
  }

  const title = product.display_name || product.name_en || product.name

  return (
    <Link href={`/products/${product.id}`}>
      <div className="card">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={title}
            style={{ width: '100%', height: '200px', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '200px',
            background: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a1a3a8',
          }}>
            بدون تصویر
          </div>
        )}
        <div className="card-content">
          <h3 className="card-title">{title}</h3>
          
          {product.rating_average > 0 && (
            <div className="rating" style={{ marginBottom: '8px' }}>
              {'★'.repeat(Math.round(product.rating_average))}
              <span style={{ fontSize: '12px', color: '#a1a3a8', marginRight: '4px' }}>
                ({product.rating_count})
              </span>
            </div>
          )}

          <div className="card-price">
            <span className="card-price-main">
              {formatPrice(price)} <span style={{ fontSize: '12px' }}>تومان</span>
            </span>
            {hasDiscount && (
              <>
                <span className="card-price-old">
                  {formatPrice(product.base_price)}
                </span>
                <span className="card-discount">
                  {discountPercent}%
                </span>
              </>
            )}
          </div>

          {product.stock === 0 && (
            <div style={{ marginTop: '8px', color: '#ef4056', fontSize: '12px' }}>
              ناموجود
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
