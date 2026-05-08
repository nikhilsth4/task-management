import type { Metadata } from 'next'
import { Geist_Mono, Space_Grotesk } from 'next/font/google'
import './globals.css'
import ThemeSync from '@/components/layout/ThemeSync'

const spaceGrotesk = Space_Grotesk({ variable: '--font-space-grotesk', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-jetbrains-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Daily Task Manager',
  description: 'Capture, prioritize, and focus on what matters today.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${geistMono.variable}`} style={{ height: '100%' }} suppressHydrationWarning>
      <body style={{ height: '100%', margin: 0, display: 'flex', background: 'var(--color-canvas)', fontFamily: 'var(--font-display, var(--font-sans))' }}>
        <ThemeSync />
        {children}
      </body>
    </html>
  )
}
