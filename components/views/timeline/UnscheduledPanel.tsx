'use client'

import { useDraggable, useDroppable } from '@dnd-kit/core'
import { type Task } from '@/store/tasks'
import { useProjectStore } from '@/store/projects'

const COLOR_MAP: Record<string, string> = {
  blue: '#3B82F6', rose: '#F43F5E', green: '#22C55E', amber: '#F59E0B',
  purple: '#A855F7', cyan: '#06B6D4', orange: '#F97316', teal: '#14B8A6',
}

interface Props {
  tasks: Task[]
  activeId: string | null
  onTaskClick: (id: string) => void
}

function DraggableUnscheduled({ task, onTaskClick }: { task: Task; onTaskClick: (id: string) => void }) {
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
        borderRadius: 7,
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.3 : 1,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        flexShrink: 0,
      }}
    >
      <span style={{
        width: 3, flexShrink: 0,
        background: accent,
        borderRadius: '2px 0 0 2px',
      }} />
      <div style={{ padding: '7px 10px', flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 12, fontWeight: 500,
          color: done ? '#AAAAAA' : '#141414',
          textDecoration: done ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {task.title}
        </p>
        {project && (
          <p style={{ margin: 0, fontSize: 10, color: '#AAAAAA', marginTop: 1 }}>
            {project.title}
          </p>
        )}
      </div>
    </div>
  )
}

export default function UnscheduledPanel({ tasks, activeId, onTaskClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unscheduled-panel' })

  return (
    <div ref={setNodeRef} style={{
      width: 200, flexShrink: 0,
      borderLeft: '1px solid #E8E6E0',
      background: isOver ? '#F0F7FF' : '#FAFAF8',
      transition: 'background 0.12s',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      <div style={{
        padding: '10px 12px 6px',
        fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
        color: '#AAAAAA', textTransform: 'uppercase', flexShrink: 0,
      }}>
        Unscheduled
      </div>

      <div style={{ padding: '0 8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {tasks.length === 0 ? (
          <p style={{ margin: '8px 4px', fontSize: 12, color: '#CCCCCC' }}>
            No unscheduled tasks
          </p>
        ) : (
          tasks.map((task) => (
            <DraggableUnscheduled
              key={task.id}
              task={task}
              onTaskClick={onTaskClick}
            />
          ))
        )}
      </div>
    </div>
  )
}
