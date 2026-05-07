'use client'

import { useDroppable } from '@dnd-kit/core'
import { type Task } from '@/store/tasks'
import DraggableCard from './DraggableCard'

export interface QuadrantConfig {
  id: string
  label: string
  sublabel: string
  badgeBg: string
  badgeText: string
}

interface QuadrantProps {
  config: QuadrantConfig
  tasks: Task[]
  activeId: string | null
  onCardClick: (id: string) => void
}

export default function Quadrant({ config, tasks, activeId, onCardClick }: QuadrantProps) {
  const { setNodeRef, isOver } = useDroppable({ id: config.id })

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col overflow-hidden transition-colors duration-150"
      style={{ background: isOver ? 'var(--color-stone)' : 'var(--color-canvas)' }}
    >
      {/* Header */}
      <div
        className="px-4 pt-3 pb-2 shrink-0"
        style={{ borderBottom: '1px solid var(--color-hairline)' }}
      >
        <span
          className="text-[11px] font-semibold px-1.5 py-0.5 rounded"
          style={{ background: config.badgeBg, color: config.badgeText }}
        >
          {config.label}
        </span>
        <p className="m-0 mt-1 text-[11px]" style={{ color: 'var(--color-slate)' }}>
          {config.sublabel}
        </p>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
        {tasks.length === 0 ? (
          <p className="text-[12px] text-center mt-6" style={{ color: 'var(--color-muted)' }}>
            Drop tasks here
          </p>
        ) : (
          tasks.map((task) => (
            <DraggableCard
              key={task.id}
              task={task}
              isDragging={task.id === activeId}
              onClick={() => onCardClick(task.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
