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

export default function TimeBlock({ task, onTaskClick }: Props) {
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
      className="h-full rounded-md px-2 py-1 overflow-hidden flex flex-col justify-center transition-opacity duration-150"
      style={{
        background: 'var(--color-stone)',
        border: `1px solid ${accent}33`,
        borderLeft: `3px solid ${accent}`,
        cursor: isDragging ? 'grabbing' : 'grab',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        opacity: isDragging ? 0.3 : 1,
      }}
    >
      <div className="flex items-baseline gap-1.5 overflow-hidden">
        <p
          className="m-0 text-[12px] font-medium overflow-hidden text-ellipsis whitespace-nowrap leading-snug flex-1 min-w-0"
          style={{
            color: done ? 'var(--color-slate)' : 'var(--color-ink)',
            textDecoration: done ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </p>
        {task.scheduledTime && (
          <span className="text-[10px] shrink-0" style={{ color: 'var(--color-slate)' }}>
            {formatTimeRange(task.scheduledTime, task.duration)}
          </span>
        )}
      </div>
    </div>
  )
}
