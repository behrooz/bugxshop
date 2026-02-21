'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getProfile, updateProfile } from '@/lib/api'

type Profile = {
  id: number
  email: string
  mobile: string
  first_name: string
  last_name: string
  email_verified: boolean
  mobile_verified: boolean
  is_admin: boolean
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    birth_date: '',
    gender: '',
  })

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      router.push('/login?redirect=/profile')
      return
    }
    loadProfile()
  }, [router])

  const loadProfile = async () => {
    try {
      const data = await getProfile()
      setProfile(data)
      setForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        mobile: data.mobile || '',
        birth_date: '',
        gender: '',
      })
    } catch {
      router.push('/login?redirect=/profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await updateProfile({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email || undefined,
        mobile: form.mobile || undefined,
        birth_date: form.birth_date || undefined,
        gender: form.gender || undefined,
      })
      setProfile((p) => p ? { ...p, ...form } : null)
      setEditing(false)
    } catch (err: any) {
      setError(err.message || 'خطا در ذخیره')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="container" style={{ padding: '40px 20px', minHeight: '50vh' }}>
          <p style={{ textAlign: 'center', color: '#a1a3a8' }}>در حال بارگذاری...</p>
        </main>
        <Footer />
      </>
    )
  }

  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'کاربر'

  return (
    <>
      <Header />
      <main className="container" style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '24px' }}>پروفایل</h1>

        {editing ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{ padding: '12px', background: '#ffebee', color: '#c62828', borderRadius: '8px' }}>
                {error}
              </div>
            )}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>نام</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>نام خانوادگی</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>ایمیل</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>موبایل</label>
              <input
                type="text"
                value={form.mobile}
                onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{ padding: '10px 24px' }}
              >
                {saving ? 'در حال ذخیره...' : 'ذخیره'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                style={{ padding: '10px 24px', background: '#f5f5f5', border: 'none', borderRadius: '8px' }}
              >
                انصراف
              </button>
            </div>
          </form>
        ) : (
          <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '24px' }}>
            <p style={{ marginBottom: '8px' }}>
              <strong>نام:</strong> {displayName}
            </p>
            {profile?.email && (
              <p style={{ marginBottom: '8px' }}>
                <strong>ایمیل:</strong> {profile.email}
                {profile.email_verified && (
                  <span style={{ marginRight: '8px', color: '#2e7d32', fontSize: '12px' }}>✓ تأیید شده</span>
                )}
              </p>
            )}
            {profile?.mobile && (
              <p style={{ marginBottom: '8px' }}>
                <strong>موبایل:</strong> {profile.mobile}
                {profile.mobile_verified && (
                  <span style={{ marginRight: '8px', color: '#2e7d32', fontSize: '12px' }}>✓ تأیید شده</span>
                )}
              </p>
            )}
            {profile?.is_admin && (
              <p style={{ marginTop: '16px' }}>
                <Link href="/admin" style={{ color: 'var(--primary)', fontWeight: 500 }}>
                  پنل مدیریت
                </Link>
              </p>
            )}
            <button
              onClick={() => setEditing(true)}
              className="btn btn-primary"
              style={{ marginTop: '20px', padding: '10px 24px' }}
            >
              ویرایش پروفایل
            </button>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
