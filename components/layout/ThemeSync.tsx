'use client'

import { useEffect } from 'react'
import { useUIStore } from '@/store/ui'

export function applyTheme(theme: string) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  }
}

export default function ThemeSync() {
  const theme = useUIStore((s) => s.theme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return null
}
