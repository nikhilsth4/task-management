'use client'

import { useDraggable } from '@dnd-kit/core'
import { type Task } from '@/store/tasks'
import MiniCard from './MiniCard'

interface DraggableCardProps {
  task: Task
  isDragging: boolean
  onClick: () => void
}

export default function DraggableCard({ task, isDragging, onClick }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      style={{
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        opacity: isDragging ? 0.3 : 1,
        cursor: 'grab',
      }}
    >
      <MiniCard task={task} />
    </div>
  )
}
