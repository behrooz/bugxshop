'use client'

import { useState, useEffect } from 'react'
import { API_ORIGIN } from '@/lib/api'

export default function ApiStatusBanner() {
  const [offline, setOffline] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`${API_ORIGIN}/health`, { method: 'GET', mode: 'cors' })
      .then((res) => {
        if (!cancelled) setOffline(!res.ok)
      })
      .catch(() => {
        if (!cancelled) setOffline(true)
      })
    return () => { cancelled = true }
  }, [])

  if (!offline || dismissed) return null

  return (
    <div
      role="alert"
      style={{
        background: '#fff3cd',
        color: '#856404',
        padding: '10px 16px',
        textAlign: 'center',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      <span>
        Backend is not reachable. Products and cart will be empty. Start the backend (e.g. F5 in <code>backend/</code> or run <code>go run main.go</code> in <code>backend/</code>), then refresh.
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        style={{
          background: 'transparent',
          border: '1px solid #856404',
          borderRadius: '4px',
          padding: '4px 12px',
          cursor: 'pointer',
          fontSize: '13px',
        }}
      >
        Dismiss
      </button>
    </div>
  )
}
