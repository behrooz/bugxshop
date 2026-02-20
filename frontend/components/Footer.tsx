export default function Footer() {
  return (
    <footer style={{
      background: '#232933',
      color: '#fff',
      padding: '40px 0',
      marginTop: '60px',
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '30px',
        }}>
          <div>
            <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>درباره ما</h3>
            <p style={{ color: '#a1a3a8', lineHeight: '1.8' }}>
              فروشگاه آنلاین پوشاک زنانه با ارائه بهترین محصولات و خدمات
            </p>
          </div>
          <div>
            <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>دسترسی سریع</h3>
            <ul style={{ listStyle: 'none', padding: 0, color: '#a1a3a8' }}>
              <li style={{ marginBottom: '8px' }}><a href="/products" style={{ color: '#a1a3a8' }}>همه محصولات</a></li>
              <li style={{ marginBottom: '8px' }}><a href="/cart" style={{ color: '#a1a3a8' }}>سبد خرید</a></li>
              <li style={{ marginBottom: '8px' }}><a href="/profile" style={{ color: '#a1a3a8' }}>پروفایل</a></li>
            </ul>
          </div>
          <div>
            <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>تماس با ما</h3>
            <p style={{ color: '#a1a3a8', marginBottom: '8px' }}>ایمیل: info@shop.com</p>
            <p style={{ color: '#a1a3a8' }}>تلفن: ۰۲۱-۱۲۳۴۵۶۷۸</p>
          </div>
        </div>
        <div style={{
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid #3a3f4a',
          textAlign: 'center',
          color: '#a1a3a8',
        }}>
          <p>&copy; ۱۴۰۳ فروشگاه پوشاک. تمامی حقوق محفوظ است.</p>
        </div>
      </div>
    </footer>
  )
}
