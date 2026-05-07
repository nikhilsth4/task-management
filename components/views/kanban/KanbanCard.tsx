'use client'

import { useDraggable } from '@dnd-kit/core'
import { type Task } from '@/store/tasks'
import { useProjectStore } from '@/store/projects'
import { formatTimeRange } from '@/lib/utils'

const COLOR_MAP: Record<string, string> = {
  blue: '#3B82F6', rose: '#F43F5E', green: '#22C55E', amber: '#F59E0B',
  purple: '#A855F7', cyan: '#06B6D4', orange: '#F97316', teal: '#14B8A6',
}

interface Props {
  task: Task
  onTaskClick: (id: string) => void
}

export default function KanbanCard({ task, onTaskClick }: Props) {
  const projects = useProjectStore((s) => s.projects)
  const project = projects.find((p) => p.id === task.projectId)
  const accent = project ? (COLOR_MAP[project.color] ?? 'var(--color-hairline)') : 'var(--color-hairline)'
  const done = task.status === 'done'

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onTaskClick(task.id)}
      className="flex items-stretch rounded-lg overflow-hidden shrink-0 transition-[box-shadow,opacity] duration-150"
      style={{
        background: 'var(--color-stone)',
        border: '1px solid var(--color-hairline)',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.3 : 1,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
      onMouseEnter={(e) => { if (!isDragging) e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)' }}
    >
      <span className="w-[3px] shrink-0 rounded-l-[2px]" style={{ background: accent }} />
      <div className="px-3 py-2.5 flex-1 min-w-0">
        <p
          className="m-0 text-[13px] font-medium overflow-hidden text-ellipsis whitespace-nowrap leading-snug"
          style={{
            color: done ? 'var(--color-slate)' : 'var(--color-ink)',
            textDecoration: done ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          {project && (
            <span className="text-[11px]" style={{ color: 'var(--color-slate)' }}>
              {project.title}
            </span>
          )}
          {task.scheduledTime && (
            <span className="text-[11px] ml-auto" style={{ color: 'var(--color-slate)' }}>
              {formatTimeRange(task.scheduledTime, task.duration)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
