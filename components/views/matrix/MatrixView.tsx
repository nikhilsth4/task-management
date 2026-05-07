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
import { useTaskStore, selectActiveTasks, type Urgency, type Importance } from '@/store/tasks'
import { useUIStore } from '@/store/ui'
import { getQuadrant } from '@/lib/utils'
import Quadrant, { type QuadrantConfig } from './Quadrant'
import MiniCard from './MiniCard'

type QuadrantId =
  | 'urgent_important'
  | 'not_urgent_important'
  | 'urgent_not_important'
  | 'not_urgent_not_important'

const QUADRANTS: QuadrantConfig[] = [
  { id: 'not_urgent_important',     label: 'Q2 · Schedule',  sublabel: 'Important, not urgent',        accent: '#2563EB', faint: '#EFF6FF' },
  { id: 'urgent_important',         label: 'Q1 · Do First',  sublabel: 'Urgent & important',           accent: '#DC2626', faint: '#FEF2F2' },
  { id: 'not_urgent_not_important', label: 'Q4 · Eliminate', sublabel: 'Neither urgent nor important', accent: '#6B7280', faint: '#F9FAFB' },
  { id: 'urgent_not_important',     label: 'Q3 · Delegate',  sublabel: 'Urgent, not important',        accent: '#D97706', faint: '#FFFBEB' },
]

const QUADRANT_MAP: Record<QuadrantId, { urgency: Urgency; importance: Importance }> = {
  urgent_important:           { urgency: 'high', importance: 'high' },
  not_urgent_important:       { urgency: 'low',  importance: 'high' },
  urgent_not_important:       { urgency: 'high', importance: 'low'  },
  not_urgent_not_important:   { urgency: 'low',  importance: 'low'  },
}

export default function MatrixView() {
  const allTasks = selectActiveTasks(useTaskStore((s) => s.tasks))
  const updateTask = useTaskStore((s) => s.updateTask)
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId)
  const filterProjectId = useUIStore((s) => s.filterProjectId)

  const tasks = allTasks.filter((t) => {
    if (filterProjectId === 'all') return true
    if (filterProjectId === '') return t.projectId === null
    return t.projectId === filterProjectId
  })

  const [activeId, setActiveId] = useState<string | null>(null)
  const activeTask = activeId ? (tasks.find((t) => t.id === activeId) ?? null) : null

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
    const quadrantId = over.id as QuadrantId
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    if (getQuadrant(task.urgency, task.importance) === quadrantId) return
    const { urgency, importance } = QUADRANT_MAP[quadrantId]
    updateTask(taskId, { urgency, importance })
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: 1,
        background: '#E8E6E0',
        flex: 1,
        height: '100%',
      }}>
        {QUADRANTS.map((q) => (
          <Quadrant
            key={q.id}
            config={q}
            tasks={tasks.filter((t) => getQuadrant(t.urgency, t.importance) === q.id)}
            activeId={activeId}
            onCardClick={setSelectedTaskId}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask && <MiniCard task={activeTask} />}
      </DragOverlay>
    </DndContext>
  )
}
