import { getProduct, getCategories } from '@/lib/api'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProductDetail from '@/components/ProductDetail'
import Link from 'next/link'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id)
  const title = product?.name || product?.name_en || product?.display_name || 'محصول'
  const desc = product?.description || product?.short_description || product?.display_description || ''
  return {
    title: `${title} - فروشگاه پوشاک زنانه`,
    description: desc,
  }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  let product: any = null
  let categories: any[] = []
  
  try {
    product = await getProduct(params.id)
    categories = await getCategories()
  } catch (error) {
    console.error('Error loading product:', error)
  }

  if (!product) {
    return (
      <>
        <Header categories={categories} />
        <main style={{ padding: '40px 0' }}>
          <div className="container">
            <h1>محصول یافت نشد</h1>
            <Link href="/products">بازگشت به لیست محصولات</Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header categories={categories} />
      <main style={{ padding: '40px 0' }}>
        <div className="container">
          <ProductDetail product={product} />
        </div>
      </main>
      <Footer />
    </>
  )
}

