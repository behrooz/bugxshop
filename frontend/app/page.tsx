import Link from 'next/link'
import { getProducts, getCategories } from '@/lib/api'
import ProductCard from '@/components/ProductCard'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'فروشگاه پوشاک زنانه - خرید آنلاین',
  description: 'خرید آنلاین پوشاک زنانه با بهترین قیمت',
}

export default async function Home() {
  let products: any[] = []
  let categories: any[] = []
  
  try {
    products = await getProducts({ limit: 12 })
    categories = await getCategories()
  } catch (error) {
    console.error('Error loading data:', error)
    // Continue with empty arrays
  }

  return (
    <>
      <Header categories={categories} />
      <main>
        {/* Hero Banner */}
        <section style={{
          background: 'linear-gradient(135deg, #ef4056 0%, #e6123d 100%)',
          color: 'white',
          padding: '60px 0',
          textAlign: 'center',
        }}>
          <div className="container">
            <h1 style={{ fontSize: '32px', marginBottom: '16px', fontWeight: '700' }}>
              به فروشگاه پوشاک زنانه خوش آمدید
            </h1>
            <p style={{ fontSize: '18px', marginBottom: '24px' }}>
              جدیدترین و شیک‌ترین پوشاک زنانه را با بهترین قیمت خریداری کنید
            </p>
            <Link href="/products" className="btn" style={{
              background: 'white',
              color: '#ef4056',
              padding: '12px 32px',
              fontSize: '16px',
            }}>
              مشاهده محصولات
            </Link>
          </div>
        </section>

        {/* Categories */}
        <section style={{ padding: '40px 0', background: 'white' }}>
          <div className="container">
            <h2 className="section-title">دسته‌بندی‌ها</h2>
            <div className="grid grid-4">
              {categories.slice(0, 8).map((category: any) => (
                <Link key={category.id} href={`/category/${category.slug}`}>
                  <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                      {category.name}
                    </h3>
                    {category.description && (
                      <p style={{ fontSize: '14px', color: '#a1a3a8' }}>
                        {category.description.substring(0, 60)}...
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section style={{ padding: '40px 0' }}>
          <div className="container">
            <h2 className="section-title">محصولات ویژه</h2>
            <div className="grid grid-4">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <Link href="/products" className="btn btn-primary">
                مشاهده همه محصولات
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
