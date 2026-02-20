import { getProducts, getCategories } from '@/lib/api'
import ProductCard from '@/components/ProductCard'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'همه محصولات - فروشگاه پوشاک زنانه',
  description: 'مشاهده تمام محصولات پوشاک زنانه',
}

export default async function ProductsPage() {
  let products: any[] = []
  let categories: any[] = []
  
  try {
    products = await getProducts()
    categories = await getCategories()
  } catch (error) {
    console.error('Error loading data:', error)
  }

  return (
    <>
      <Header categories={categories} />
      <main style={{ padding: '40px 0' }}>
        <div className="container">
          <h1 style={{ fontSize: '28px', marginBottom: '24px' }}>همه محصولات</h1>
          <div className="grid grid-4" style={{ marginTop: '30px' }}>
            {products.length > 0 ? (
              products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#666' }}>
                محصولی یافت نشد
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

