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
        display: 'flex', alignItems: 'stretch',
        background: '#FFFFFF',
        border: '1px solid #E8E6E0',
        borderRadius: 8,
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.3 : 1,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.15s, opacity 0.15s',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { if (!isDragging) e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)' }}
    >
      <span style={{
        width: 3, flexShrink: 0,
        background: accent,
        borderRadius: '2px 0 0 2px',
      }} />
      <div style={{ padding: '10px 12px', flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 13, fontWeight: 500,
          color: done ? '#AAAAAA' : '#141414',
          textDecoration: done ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          lineHeight: 1.4,
        }}>
          {task.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          {project && (
            <span style={{ fontSize: 11, color: '#AAAAAA' }}>{project.title}</span>
          )}
          {task.scheduledTime && (
            <span style={{ fontSize: 11, color: '#AAAAAA', marginLeft: 'auto' }}>
              {formatTimeRange(task.scheduledTime, task.duration)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
