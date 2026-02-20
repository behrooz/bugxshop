import type { Metadata } from 'next'
import './globals.css'
import ApiStatusBanner from '@/components/ApiStatusBanner'

export const metadata: Metadata = {
  title: 'فروشگاه پوشاک زنانه - خرید آنلاین لباس زنانه',
  description: 'خرید آنلاین پوشاک زنانه با بهترین قیمت. انواع لباس، کفش، کیف و اکسسوری زنانه از برندهای معتبر',
  keywords: 'پوشاک زنانه, لباس زنانه, خرید آنلاین, مد و فشن',
  openGraph: {
    title: 'فروشگاه پوشاک زنانه',
    description: 'خرید آنلاین پوشاک زنانه',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <ApiStatusBanner />
        {children}
      </body>
    </html>
  )
}

