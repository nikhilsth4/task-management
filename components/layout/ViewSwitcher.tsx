'use client'

import { useUIStore, type View } from '@/store/ui'

const TABS: { label: string; view: View }[] = [
  { label: 'List',     view: 'list'     },
  { label: 'Matrix',   view: 'matrix'   },
  { label: 'Timeline', view: 'timeline' },
  { label: 'Kanban',   view: 'kanban'   },
]

export default function ViewSwitcher() {
  const activeView = useUIStore((s) => s.activeView)
  const setActiveView = useUIStore((s) => s.setActiveView)

  return (
    <div
      className="flex shrink-0 px-6"
      style={{ borderBottom: '1px solid var(--color-hairline)', background: 'var(--color-canvas)' }}
    >
      {TABS.map(({ label, view }) => {
        const active = activeView === view
        return (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className="px-4 py-3 text-[13px] bg-transparent border-none cursor-pointer transition-colors"
            style={{
              color: active ? 'var(--color-ink)' : 'var(--color-slate)',
              fontWeight: active ? 600 : 400,
              borderBottom: active ? '2px solid var(--color-ink)' : '2px solid transparent',
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
