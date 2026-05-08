'use client'

import { useMemo } from 'react'
import { useTaskStore } from '@/store/tasks'
import { useProjectStore } from '@/store/projects'
import { useUIStore } from '@/store/ui'

const COLOR_MAP: Record<string, string> = {
  blue: '#3B82F6', rose: '#F43F5E', green: '#22C55E', amber: '#F59E0B',
  purple: '#A855F7', cyan: '#06B6D4', orange: '#F97316', teal: '#14B8A6',
}

export default function HistoryPage() {
  const tasks = useTaskStore((s) => s.tasks)
  const projects = useProjectStore((s) => s.projects)
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId)

  const grouped = useMemo(() => {
    const done = tasks
      .filter((t) => t.status === 'done' && t.completedAt)
      .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!))

    const map = new Map<string, typeof done>()
    for (const task of done) {
      const date = task.completedAt!.slice(0, 10)
      if (!map.has(date)) map.set(date, [])
      map.get(date)!.push(task)
    }
    return [...map.entries()]
  }, [tasks])

  function formatDate(dateStr: string) {
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    if (dateStr === today) return 'Today'
    if (dateStr === yesterday) return 'Yesterday'
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    })
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-7" style={{ background: 'var(--color-canvas)' }}>
      <h1 className="m-0 mb-6 text-[20px] font-semibold" style={{ color: 'var(--color-ink)' }}>
        Completed
      </h1>

      {grouped.length === 0 ? (
        <p className="text-[13px]" style={{ color: 'var(--color-muted)' }}>No completed tasks yet.</p>
      ) : (
        grouped.map(([date, dateTasks]) => (
          <div key={date} className="mb-7">
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="text-[11px] font-bold tracking-[0.06em] uppercase" style={{ color: 'var(--color-muted)' }}>
                {formatDate(date)}
              </span>
              <span
                className="text-[11px] font-medium px-1.5 py-px rounded-[10px]"
                style={{ color: 'var(--color-muted)', background: 'var(--color-stone)' }}
              >
                {dateTasks.length}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              {dateTasks.map((task) => {
                const project = projects.find((p) => p.id === task.projectId)
                const accent = project ? (COLOR_MAP[project.color] ?? 'var(--color-hairline)') : 'var(--color-hairline)'
                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') setSelectedTaskId(task.id) }}
                    className="flex items-stretch rounded-lg overflow-hidden cursor-pointer transition-shadow duration-150 hover:shadow-md"
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-hairline)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <span className="w-[3px] shrink-0" style={{ background: accent }} />
                    <div className="px-3.5 py-2.5 flex-1 min-w-0">
                      <p
                        className="m-0 text-[13px] font-medium overflow-hidden text-ellipsis whitespace-nowrap line-through"
                        style={{ color: 'var(--color-slate)' }}
                      >
                        {task.title}
                      </p>
                      <div className="flex gap-2 mt-0.5">
                        {project && (
                          <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>{project.title}</span>
                        )}
                        {task.pomodoroSessions > 0 && (
                          <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                            {task.pomodoroSessions} × 25 min focus
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="self-center pr-3.5 text-[11px] shrink-0" style={{ color: 'var(--color-muted)' }}>
                      {new Date(task.completedAt!).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
