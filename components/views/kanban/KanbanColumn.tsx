'use client'

import { useDroppable } from '@dnd-kit/core'
import { type Task } from '@/store/tasks'
import KanbanCard from './KanbanCard'

export interface ColumnConfig {
  id: string
  label: string
  accent: string
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
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: isOver ? '#F5F8FF' : '#F7F6F3',
      border: '1px solid #E8E6E0',
      borderRadius: 10,
      transition: 'background 0.12s',
      minWidth: 0, flex: 1,
    }}>
      {/* Column header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 14px 10px',
        borderBottom: '1px solid #ECEAE4',
        flexShrink: 0,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: config.accent, flexShrink: 0,
        }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#555', letterSpacing: '0.03em' }}>
          {config.label}
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: 11, color: '#AAAAAA',
          background: '#ECEAE4', borderRadius: 10,
          padding: '1px 7px', fontWeight: 500,
        }}>
          {tasks.filter((t) => t.id !== activeId).length}
        </span>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1, overflowY: 'auto',
          padding: '10px 10px 14px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}
      >
        {tasks.length === 0 ? (
          <p style={{ margin: '8px 4px', fontSize: 12, color: '#CCCCCC' }}>No tasks</p>
        ) : (
          tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onTaskClick={onTaskClick} />
          ))
        )}
      </div>
    </div>
  )
}
