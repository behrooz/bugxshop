import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function NotFound() {
  return (
    <>
      <Header categories={[]} />
      <main style={{ padding: '60px 0', textAlign: 'center', minHeight: '60vh' }}>
        <div className="container">
          <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>404</h1>
          <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>صفحه یافت نشد</h2>
          <p style={{ marginBottom: '32px', color: '#666' }}>
            متأسفانه صفحه‌ای که به دنبال آن هستید وجود ندارد.
          </p>
          <Link href="/" className="btn btn-primary">
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}

