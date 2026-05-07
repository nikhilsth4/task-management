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
  const accent = project ? (COLOR_MAP[project.color] ?? '#E5E7EB') : '#E5E7EB'
  const done = task.status === 'done'

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onTaskClick(task.id)}
      style={{
        height: '100%',
        background: '#FFFFFF',
        border: `1px solid ${accent}33`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 6,
        padding: '4px 8px',
        cursor: isDragging ? 'grabbing' : 'grab',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        opacity: isDragging ? 0.3 : 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, overflow: 'hidden' }}>
        <p style={{
          margin: 0, fontSize: 12, fontWeight: 500,
          color: done ? '#AAAAAA' : '#141414',
          textDecoration: done ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          lineHeight: 1.3, flex: 1, minWidth: 0,
        }}>
          {task.title}
        </p>
        {task.scheduledTime && (
          <span style={{ fontSize: 10, color: '#AAAAAA', flexShrink: 0 }}>
            {formatTimeRange(task.scheduledTime, task.duration)}
          </span>
        )}
      </div>
    </div>
  )
}
