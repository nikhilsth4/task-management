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
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: 'var(--color-canvas)' }}>
      <h1 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 600, color: '#141414' }}>
        Completed
      </h1>

      {grouped.length === 0 ? (
        <p style={{ fontSize: 13, color: '#CCCCCC' }}>No completed tasks yet.</p>
      ) : (
        grouped.map(([date, dateTasks]) => (
          <div key={date} style={{ marginBottom: 28 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#AAAAAA', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {formatDate(date)}
              </span>
              <span style={{
                fontSize: 11, color: '#AAAAAA', background: '#ECEAE4',
                borderRadius: 10, padding: '1px 7px', fontWeight: 500,
              }}>
                {dateTasks.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {dateTasks.map((task) => {
                const project = projects.find((p) => p.id === task.projectId)
                const accent = project ? (COLOR_MAP[project.color] ?? '#E5E7EB') : '#E5E7EB'
                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') setSelectedTaskId(task.id) }}
                    style={{
                      display: 'flex', alignItems: 'stretch',
                      background: '#FFFFFF', border: '1px solid #E8E6E0',
                      borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <span style={{ width: 3, flexShrink: 0, background: accent }} />
                    <div style={{ padding: '10px 14px', flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: 0, fontSize: 13, fontWeight: 500,
                        color: '#AAAAAA', textDecoration: 'line-through',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {task.title}
                      </p>
                      <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                        {project && (
                          <span style={{ fontSize: 11, color: '#CCCCCC' }}>{project.title}</span>
                        )}
                        {task.pomodoroSessions > 0 && (
                          <span style={{ fontSize: 11, color: '#CCCCCC' }}>
                            {task.pomodoroSessions} × 25 min focus
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{
                      alignSelf: 'center', paddingRight: 14,
                      fontSize: 11, color: '#CCCCCC', flexShrink: 0,
                    }}>
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
