'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as yup from 'yup'
import { createClient } from '@/lib/supabase/client'

const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
})

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    try {
      await schema.validate({ email, password }, { abortEarly: false })
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const errors: Record<string, string> = {}
        err.inner.forEach((e) => { if (e.path) errors[e.path] = e.message })
        setFieldErrors(errors)
        return
      }
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--color-canvas)' }}>
      <div
        className="w-full max-w-sm rounded-xl px-8 py-8"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-hairline)' }}
      >
        <h1 className="text-[20px] font-semibold mb-6" style={{ color: 'var(--color-ink)' }}>
          Sign in
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Email" error={fieldErrors.email}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 rounded-lg text-[14px] outline-none"
              style={{ background: 'var(--color-stone)', border: `1px solid ${fieldErrors.email ? '#DC2626' : 'var(--color-hairline)'}`, color: 'var(--color-ink)' }}
            />
          </Field>

          <Field label="Password" error={fieldErrors.password}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-[14px] outline-none"
              style={{ background: 'var(--color-stone)', border: `1px solid ${fieldErrors.password ? '#DC2626' : 'var(--color-hairline)'}`, color: 'var(--color-ink)' }}
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

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium" style={{ color: 'var(--color-slate)' }}>{label}</label>
      {children}
      {error && <p className="text-[11px] m-0" style={{ color: '#DC2626' }}>{error}</p>}
    </div>
  )
}
