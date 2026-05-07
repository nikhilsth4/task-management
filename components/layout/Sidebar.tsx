'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useProjectStore } from '@/store/projects'

const NAV = [
  { label: 'Today', href: '/', icon: '◈' },
  { label: 'Review', href: '/review', icon: '◎' },
  { label: 'Settings', href: '/settings', icon: '◧' },
]

const COLOR_MAP: Record<string, string> = {
  blue: '#3B82F6',
  rose: '#F43F5E',
  green: '#22C55E',
  amber: '#F59E0B',
  purple: '#A855F7',
  cyan: '#06B6D4',
  orange: '#F97316',
  teal: '#14B8A6',
}

export default function Sidebar() {
  const pathname = usePathname()
  const projects = useProjectStore((s) => s.projects)

  return (
    <aside style={{
      width: 200,
      flexShrink: 0,
      background: '#141414',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      padding: '24px 0',
      height: '100%',
    }}>
      {/* App name */}
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #2A2A2A' }}>
        <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Focus
        </span>
      </div>

      {/* Nav */}
      <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ label, href, icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 6,
                textDecoration: 'none',
                background: active ? '#2A2A2A' : 'transparent',
                color: active ? '#FFFFFF' : '#888888',
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <span style={{ fontSize: 12, opacity: 0.7 }}>{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Projects */}
      {projects.length > 0 && (
        <div style={{ padding: '0 12px', marginTop: 8 }}>
          <p style={{ color: '#444', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 10px', marginBottom: 8 }}>
            Projects
          </p>
          {projects.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: COLOR_MAP[p.color] ?? '#888', flexShrink: 0 }} />
              <span style={{ color: '#888', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}
