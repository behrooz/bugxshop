'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    mobile: '',
    password: '',
    first_name: '',
    last_name: '',
  })
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        // Login
        const response = await fetch('http://localhost:8080/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        })

        const data = await response.json()
        if (response.ok) {
          localStorage.setItem('token', data.token)
          localStorage.setItem('user_id', data.user_id)
          router.push(redirectTo)
        } else {
          setError(data.error || 'خطا در ورود')
        }
      } else {
        // Register
        const response = await fetch('http://localhost:8080/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        const data = await response.json()
        if (response.ok) {
          localStorage.setItem('token', data.token)
          localStorage.setItem('user_id', data.user_id)
          router.push(redirectTo)
        } else {
          setError(data.error || 'خطا در ثبت‌نام')
        }
      }
    } catch (err: any) {
      setError('خطا در ارتباط با سرور')
    } finally {
      setLoading(false)
    }
  }

  const handleSendOTP = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: formData.mobile,
          type: 'mobile',
          purpose: isLogin ? 'login' : 'register',
        }),
      })

      const data = await response.json()
      if (response.ok) {
        setOtpSent(true)
        alert(`کد OTP: ${data.otp}`) // Remove in production
      } else {
        setError(data.error || 'خطا در ارسال کد')
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header categories={[]} />
      <main style={{ padding: '60px 0', minHeight: '70vh' }}>
        <div className="container" style={{ maxWidth: '500px' }}>
          <div className="card" style={{ padding: '32px' }}>
            <h1 style={{ fontSize: '24px', marginBottom: '24px', textAlign: 'center' }}>
              {isLogin ? 'ورود' : 'ثبت‌نام'}
            </h1>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', justifyContent: 'center' }}>
              <button
                onClick={() => setIsLogin(true)}
                className={isLogin ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ padding: '8px 16px' }}
              >
                ورود
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={!isLogin ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ padding: '8px 16px' }}
              >
                ثبت‌نام
              </button>
            </div>

            {error && (
              <div style={{
                padding: '12px',
                background: '#fee',
                color: '#c00',
                borderRadius: '4px',
                marginBottom: '16px',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px' }}>نام</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px' }}>نام خانوادگی</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                </>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>ایمیل</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              {isLogin && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px' }}>رمز عبور</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              )}

              {!isLogin && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px' }}>رمز عبور</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: '16px' }}
              >
                {loading ? 'در حال پردازش...' : isLogin ? 'ورود' : 'ثبت‌نام'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e0e0e0' }}>
              <p style={{ marginBottom: '16px', color: '#666' }}>یا</p>
              <button
                onClick={handleSendOTP}
                disabled={loading || !formData.mobile}
                className="btn btn-secondary"
                style={{ width: '100%', marginBottom: '16px' }}
              >
                ورود با کد یکبار مصرف
              </button>

              {otpSent && (
                <div style={{ marginTop: '16px' }}>
                  <input
                    type="text"
                    placeholder="کد OTP"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '12px' }}
                  />
                  <button
                    onClick={async () => {
                      const response = await fetch('http://localhost:8080/api/v1/auth/verify-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          mobile: formData.mobile,
                          code: otpCode,
                          type: 'mobile',
                          purpose: isLogin ? 'login' : 'register',
                        }),
                      })
                      const data = await response.json()
                      if (response.ok) {
                        localStorage.setItem('token', data.token)
                        router.push('/')
                      } else {
                        setError(data.error || 'کد نامعتبر')
                      }
                    }}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    تایید کد
                  </button>
                </div>
              )}

              {!otpSent && (
                <div style={{ marginTop: '16px' }}>
                  <input
                    type="tel"
                    placeholder="شماره موبایل"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

