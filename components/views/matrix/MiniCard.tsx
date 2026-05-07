'use client'

import { type Task } from '@/store/tasks'
import { useProjectStore } from '@/store/projects'
import { formatTimeRange } from '@/lib/utils'

const COLOR_MAP: Record<string, string> = {
  blue: '#3B82F6', rose: '#F43F5E', green: '#22C55E', amber: '#F59E0B',
  purple: '#A855F7', cyan: '#06B6D4', orange: '#F97316', teal: '#14B8A6',
}

export default function MiniCard({ task }: { task: Task }) {
  const projects = useProjectStore((s) => s.projects)
  const project = projects.find((p) => p.id === task.projectId)
  const done = task.status === 'done'

  return (
    <div
      className="flex items-stretch rounded-lg overflow-hidden"
      style={{
        background: 'var(--color-stone)',
        border: '1px solid var(--color-hairline)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <span
        className="w-[3px] shrink-0"
        style={{ background: project ? (COLOR_MAP[project.color] ?? 'var(--color-hairline)') : 'var(--color-hairline)' }}
      />
      <div className="flex-1 px-2.5 py-2 min-w-0">
        <p
          className="m-0 text-[13px] font-medium overflow-hidden text-ellipsis whitespace-nowrap leading-snug"
          style={{
            color: done ? 'var(--color-slate)' : 'var(--color-ink)',
            textDecoration: done ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </p>
        <div className="flex gap-2 mt-0.5">
          {project && (
            <p className="m-0 text-[11px]" style={{ color: 'var(--color-slate)' }}>{project.title}</p>
          )}
          {task.scheduledTime && (
            <p className="m-0 text-[11px]" style={{ color: 'var(--color-slate)' }}>
              {formatTimeRange(task.scheduledTime, task.duration)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
