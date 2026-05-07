'use client'

import { useDroppable } from '@dnd-kit/core'
import { type Task } from '@/store/tasks'
import DraggableCard from './DraggableCard'

export interface QuadrantConfig {
  id: string
  label: string
  sublabel: string
  accent: string
  faint: string
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
      style={{
        background: isOver ? config.faint : '#FAFAF9',
        display: 'flex',
        flexDirection: 'column',
        transition: 'background 0.15s',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '12px 16px 8px',
        borderBottom: `2px solid ${config.accent}20`,
        flexShrink: 0,
      }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: config.accent, letterSpacing: '0.02em' }}>
          {config.label}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#AAAAAA' }}>
          {config.sublabel}
        </p>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {tasks.length === 0 ? (
          <p style={{ fontSize: 12, color: '#CCCCCC', textAlign: 'center', marginTop: 24 }}>
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
