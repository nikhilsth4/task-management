'use client'

import { useUIStore, type View } from '@/store/ui'

const TABS: { label: string; view: View }[] = [
  { label: 'List', view: 'list' },
  { label: 'Matrix', view: 'matrix' },
  { label: 'Timeline', view: 'timeline' },
  { label: 'Kanban', view: 'kanban' },
]

export default function ViewSwitcher() {
  const activeView = useUIStore((s) => s.activeView)
  const setActiveView = useUIStore((s) => s.setActiveView)

  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #E8E6E0', padding: '0 24px', background: '#F7F6F3' }}>
      {TABS.map(({ label, view }) => {
        const active = activeView === view
        return (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            style={{
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              color: active ? '#141414' : '#999',
              background: 'none',
              border: 'none',
              borderBottom: active ? '2px solid #141414' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'color 0.15s',
              marginBottom: -1,
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
