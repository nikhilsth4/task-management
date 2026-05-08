'use client'

import { Menu } from 'lucide-react'
import { useUIStore } from '@/store/ui'

export default function MobileHeader() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)
  if (sidebarOpen) return null
  return (
    <button
      className="fixed top-3.5 left-3.5 z-[60] sm:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
      style={{ background: 'var(--color-stone)', border: '1px solid var(--color-hairline)' }}
      onClick={() => setSidebarOpen(true)}
      aria-label="Open menu"
    >
      <Menu size={18} style={{ color: 'var(--color-ink)' }} />
    </button>
  )
}
