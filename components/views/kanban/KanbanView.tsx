'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useTaskStore, type Status } from '@/store/tasks'
import { useUIStore } from '@/store/ui'
import { isoToday } from '@/lib/utils'
import KanbanColumn, { type ColumnConfig } from './KanbanColumn'
import MiniCard from '../matrix/MiniCard'

const COLUMNS: ColumnConfig[] = [
  { id: 'todo',        label: 'To Do',       accent: '#6B7280' },
  { id: 'in_progress', label: 'In Progress',  accent: '#2563EB' },
  { id: 'done',        label: 'Done',         accent: '#16A34A' },
]

export default function KanbanView() {
  const allTasks = useTaskStore((s) => s.tasks)
  const updateTask = useTaskStore((s) => s.updateTask)
  const completeTask = useTaskStore((s) => s.completeTask)
  const filterProjectId = useUIStore((s) => s.filterProjectId)
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId)

  const [activeId, setActiveId] = useState<string | null>(null)
  const activeTask = activeId ? allTasks.find((t) => t.id === activeId) ?? null : null

  const today = isoToday()
  const tasks = allTasks
    .filter((t) => t.scheduledDate === null || t.scheduledDate === today)
    .filter((t) => {
      if (filterProjectId === 'all') return true
      if (filterProjectId === '') return t.projectId === null
      return t.projectId === filterProjectId
    })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over) return
    const taskId = active.id as string
    const newStatus = over.id as Status
    const task = allTasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return
    if (newStatus === 'done') {
      completeTask(taskId)
    } else {
      updateTask(taskId, { status: newStatus, completedAt: null })
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={{
        display: 'flex', gap: 12,
        padding: 16, height: '100%', boxSizing: 'border-box',
      }}>
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            config={col}
            tasks={tasks.filter((t) => t.status === col.id)}
            activeId={activeId}
            onTaskClick={setSelectedTaskId}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask && <MiniCard task={activeTask} />}
      </DragOverlay>
    </DndContext>
  )
}
