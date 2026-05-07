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
  const accent = project ? (COLOR_MAP[project.color] ?? 'var(--color-hairline)') : 'var(--color-hairline)'
  const done = task.status === 'done'

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onTaskClick(task.id)}
      className="flex items-stretch rounded-lg overflow-hidden shrink-0 transition-opacity duration-150"
      style={{
        background: 'var(--color-stone)',
        border: '1px solid var(--color-hairline)',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.3 : 1,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <span className="w-[3px] shrink-0" style={{ background: accent }} />
      <div className="px-2.5 py-2 flex-1 min-w-0">
        <p
          className="m-0 text-[12px] font-medium overflow-hidden text-ellipsis whitespace-nowrap"
          style={{
            color: done ? 'var(--color-slate)' : 'var(--color-ink)',
            textDecoration: done ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </p>
        {project && (
          <p className="m-0 text-[10px] mt-0.5" style={{ color: 'var(--color-slate)' }}>
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
    <div
      ref={setNodeRef}
      className="w-[200px] shrink-0 flex flex-col overflow-y-auto transition-colors duration-150"
      style={{
        borderLeft: '1px solid var(--color-hairline)',
        background: isOver ? 'var(--badge-q2-bg)' : 'var(--color-canvas)',
      }}
    >
      <div
        className="px-3 pt-2.5 pb-1.5 text-[10px] font-bold tracking-widest uppercase shrink-0"
        style={{ color: 'var(--color-muted)' }}
      >
        Unscheduled
      </div>

      <div className="px-2 pb-3 flex flex-col gap-1.5">
        {tasks.length === 0 ? (
          <p className="mx-1 my-2 text-[12px]" style={{ color: 'var(--color-muted)' }}>
            No unscheduled tasks
          </p>
        ) : (
          tasks.filter((t) => t.id !== activeId).map((task) => (
            <DraggableUnscheduled key={task.id} task={task} onTaskClick={onTaskClick} />
          ))
        )}
      </div>
    </div>
  )
}
