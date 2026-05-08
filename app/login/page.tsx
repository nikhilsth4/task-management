'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-canvas)' }}>
      <div
        className="w-full max-w-sm rounded-xl px-8 py-8"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-hairline)' }}
      >
        <h1 className="text-[20px] font-semibold mb-6" style={{ color: 'var(--color-ink)' }}>
          Sign in
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2 rounded-lg text-[14px] outline-none"
              style={{ background: 'var(--color-stone)', border: '1px solid var(--color-hairline)', color: 'var(--color-ink)' }}
            />
          </Field>

          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg text-[14px] outline-none"
              style={{ background: 'var(--color-stone)', border: '1px solid var(--color-hairline)', color: 'var(--color-ink)' }}
            />
          </Field>

          {error && (
            <p className="text-[13px]" style={{ color: '#DC2626' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg text-[14px] font-medium cursor-pointer transition-opacity disabled:opacity-50"
            style={{ background: 'var(--color-blue-action)', color: '#fff' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-5 flex flex-col gap-2 text-[13px]" style={{ color: 'var(--color-slate)' }}>
          <Link href="/signup" className="hover:underline">Don't have an account? Sign up</Link>
          <Link href="/reset-password" className="hover:underline">Forgot password?</Link>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium" style={{ color: 'var(--color-slate)' }}>{label}</label>
      {children}
    </div>
  )
}
