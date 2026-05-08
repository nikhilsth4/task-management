'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password/confirm`,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-canvas)' }}>
      <div
        className="w-full max-w-sm rounded-xl px-8 py-8"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-hairline)' }}
      >
        <h1 className="text-[20px] font-semibold mb-6" style={{ color: 'var(--color-ink)' }}>
          Reset password
        </h1>

        {sent ? (
          <div className="flex flex-col gap-4">
            <p className="text-[14px]" style={{ color: 'var(--color-ink)' }}>
              Check your email for a reset link.
            </p>
            <Link href="/login" className="text-[13px] hover:underline" style={{ color: 'var(--color-slate)' }}>
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium" style={{ color: 'var(--color-slate)' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full px-3 py-2 rounded-lg text-[14px] outline-none"
                style={{ background: 'var(--color-stone)', border: '1px solid var(--color-hairline)', color: 'var(--color-ink)' }}
              />
            </div>

            {error && (
              <p className="text-[13px]" style={{ color: '#DC2626' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg text-[14px] font-medium cursor-pointer transition-opacity disabled:opacity-50"
              style={{ background: 'var(--color-blue-action)', color: '#fff' }}
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>

            <Link href="/login" className="text-[13px] hover:underline" style={{ color: 'var(--color-slate)' }}>
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
