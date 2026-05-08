'use client'

import { useDroppable } from '@dnd-kit/core'
import { type Task } from '@/store/tasks'
import KanbanCard from './KanbanCard'

export interface ColumnConfig {
  id: string
  label: string
  accentVar: string
}

interface Props {
  config: ColumnConfig
  tasks: Task[]
  activeId: string | null
  onTaskClick: (id: string) => void
}

export default function KanbanColumn({ config, tasks, activeId, onTaskClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: config.id })

  return (
    <div
      className="flex flex-col min-w-[280px] sm:min-w-0 flex-1 snap-start rounded-[10px] transition-colors duration-150"
      style={{
        background: isOver ? 'var(--badge-q2-bg)' : 'var(--color-canvas)',
        border: '1px solid var(--color-hairline)',
      }}
    >
      <div
        className="flex items-center gap-2 px-3.5 pt-3 pb-2.5 shrink-0"
        style={{ borderBottom: '1px solid var(--color-hairline)' }}
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: config.accentVar }}
        />
        <span
          className="text-[12px] font-semibold tracking-[0.03em]"
          style={{ color: 'var(--color-slate)' }}
        >
          {config.label}
        </span>
        <span
          className="ml-auto text-[11px] font-medium px-1.5 py-px rounded-[10px]"
          style={{
            color: 'var(--color-muted)',
            background: 'var(--color-stone)',
          }}
        >
          {tasks.filter((t) => t.id !== activeId).length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto px-2.5 pb-3.5 pt-2.5 flex flex-col gap-2"
      >
        {tasks.length === 0 ? (
          <p className="mx-1 my-2 text-[12px]" style={{ color: 'var(--color-muted)' }}>
            No tasks
          </p>
        ) : (
          tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onTaskClick={onTaskClick} />
          ))
        )}
      </div>
    </div>
  )
}
