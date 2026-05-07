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
import { useTaskStore, type Urgency, type Importance } from '@/store/tasks'
import { useUIStore } from '@/store/ui'
import { getQuadrant, isoToday } from '@/lib/utils'
import Quadrant, { type QuadrantConfig } from './Quadrant'
import MiniCard from './MiniCard'

type QuadrantId =
  | 'urgent_important'
  | 'not_urgent_important'
  | 'urgent_not_important'
  | 'not_urgent_not_important'

const QUADRANTS: QuadrantConfig[] = [
  { id: 'not_urgent_important',     label: 'Q2 · Schedule',  sublabel: 'Important, not urgent',        badgeBg: 'var(--badge-q2-bg)', badgeText: 'var(--badge-q2-text)' },
  { id: 'urgent_important',         label: 'Q1 · Do First',  sublabel: 'Urgent & important',           badgeBg: 'var(--badge-q1-bg)', badgeText: 'var(--badge-q1-text)' },
  { id: 'not_urgent_not_important', label: 'Q4 · Eliminate', sublabel: 'Neither urgent nor important', badgeBg: 'var(--badge-q4-bg)', badgeText: 'var(--badge-q4-text)' },
  { id: 'urgent_not_important',     label: 'Q3 · Delegate',  sublabel: 'Urgent, not important',        badgeBg: 'var(--badge-q3-bg)', badgeText: 'var(--badge-q3-text)' },
]

const QUADRANT_MAP: Record<QuadrantId, { urgency: Urgency; importance: Importance }> = {
  urgent_important:           { urgency: 'high', importance: 'high' },
  not_urgent_important:       { urgency: 'low',  importance: 'high' },
  urgent_not_important:       { urgency: 'high', importance: 'low'  },
  not_urgent_not_important:   { urgency: 'low',  importance: 'low'  },
}

export default function MatrixView() {
  const allTasks = useTaskStore((s) => s.tasks)
  const updateTask = useTaskStore((s) => s.updateTask)
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId)
  const filterProjectId = useUIStore((s) => s.filterProjectId)

  const today = isoToday()
  const tasks = allTasks
    .filter((t) => t.scheduledDate === null || t.scheduledDate === today)
    .filter((t) => {
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
      <div
        className="grid flex-1 h-full"
        style={{
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: 1,
          background: 'var(--color-hairline)',
        }}
      >
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
