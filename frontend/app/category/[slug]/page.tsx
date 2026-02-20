import { getProducts, getCategories } from '@/lib/api'
import ProductCard from '@/components/ProductCard'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  try {
    const categories = await getCategories()
    const category = categories.find((cat: any) => cat.slug === params.slug)
    
    if (!category) {
      return {
        title: 'دسته‌بندی یافت نشد',
      }
    }

    return {
      title: `${category.name} - فروشگاه پوشاک زنانه`,
      description: category.description || `محصولات ${category.name}`,
    }
  } catch (error) {
    return {
      title: 'دسته‌بندی',
    }
  }
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  let categories: any[] = []
  let products: any[] = []
  let category: any = null
  
  try {
    categories = await getCategories()
    category = categories.find((cat: any) => cat.slug === params.slug)

    if (!category) {
      notFound()
    }

    products = await getProducts({ category_id: category.id.toString() })
  } catch (error) {
    console.error('Error loading category:', error)
  }

  if (!category) {
    notFound()
  }

  return (
    <>
      <Header categories={categories} />
      <main style={{ padding: '40px 0' }}>
        <div className="container">
          <h1>{category.name}</h1>
          {category.description && (
            <p style={{ marginTop: '10px', color: '#666' }}>{category.description}</p>
          )}
          <div className="grid grid-4" style={{ marginTop: '30px' }}>
            {products.length > 0 ? (
              products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <p>محصولی در این دسته‌بندی یافت نشد.</p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

