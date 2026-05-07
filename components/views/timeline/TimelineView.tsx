'use client'

import { useState, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useTaskStore } from '@/store/tasks'
import { useUIStore } from '@/store/ui'
import { isoToday } from '@/lib/utils'
import TimeGrid from './TimeGrid'
import UnscheduledPanel from './UnscheduledPanel'
import MiniCard from '../matrix/MiniCard'

export default function TimelineView() {
  const allTasks = useTaskStore((s) => s.tasks)
  const addTask = useTaskStore((s) => s.addTask)
  const updateTask = useTaskStore((s) => s.updateTask)
  const settings = useUIStore((s) => s.settings)
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId)
  const filterProjectId = useUIStore((s) => s.filterProjectId)

  const [viewDate, setViewDate] = useState(isoToday())
  const [activeId, setActiveId] = useState<string | null>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const filtered = allTasks.filter((t) => {
    if (filterProjectId === 'all') return true
    if (filterProjectId === '') return t.projectId === null
    return t.projectId === filterProjectId
  })

  const scheduled = filtered.filter((t) => t.scheduledDate === viewDate && t.scheduledTime)
  const unscheduled = filtered.filter((t) => !t.scheduledDate)
  const activeTask = activeId ? allTasks.find((t) => t.id === activeId) ?? null : null

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
    const slotId = over.id as string

    if (slotId === 'unscheduled-panel') {
      const task = allTasks.find((t) => t.id === taskId)
      if (!task) return
      if (!task.scheduledDate && !task.scheduledTime) return
      updateTask(taskId, { scheduledDate: null, scheduledTime: null })
      return
    }

    if (!slotId.startsWith('slot-')) return
    const [, hStr, mStr] = slotId.split('-')
    const hour = parseInt(hStr, 10)
    const minute = parseInt(mStr, 10)
    const newTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

    const task = allTasks.find((t) => t.id === taskId)
    if (!task) return
    if (task.scheduledDate === viewDate && task.scheduledTime === newTime) return

    updateTask(taskId, { scheduledDate: viewDate, scheduledTime: newTime })
  }

  function handleSlotClick(hour: number, minute: number) {
    const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    const task = addTask({ title: 'New task', scheduledDate: viewDate, scheduledTime: time })
    setSelectedTaskId(task.id)
  }

  function prevDay() {
    const d = new Date(viewDate)
    d.setDate(d.getDate() - 1)
    setViewDate(d.toISOString().slice(0, 10))
  }

  function nextDay() {
    const d = new Date(viewDate)
    d.setDate(d.getDate() + 1)
    setViewDate(d.toISOString().slice(0, 10))
  }

  const isToday = viewDate === isoToday()
  const displayDate = new Date(viewDate + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full overflow-hidden">

        {/* Date nav bar */}
        <div
          className="flex items-center gap-3 px-5 py-2.5 shrink-0"
          style={{ borderBottom: '1px solid var(--color-hairline)', background: 'var(--color-canvas)' }}
        >
          <button
            onClick={prevDay}
            className="w-7 h-7 flex items-center justify-center rounded-md text-base cursor-pointer bg-transparent transition-colors hover:bg-stone"
            style={{ border: '1px solid var(--color-hairline)', color: 'var(--color-slate)', lineHeight: 1 }}
          >‹</button>

          <div className="relative min-w-[200px] text-center">
            <span
              onClick={() => dateInputRef.current?.showPicker()}
              className="text-[14px] font-medium cursor-pointer select-none"
              style={{ color: 'var(--color-ink)' }}
            >
              {displayDate}
              {isToday && (
                <span
                  className="ml-2 text-[11px] font-semibold px-1.5 py-0.5 rounded"
                  style={{ color: 'var(--color-blue-action)', background: 'var(--badge-q2-bg)' }}
                >
                  TODAY
                </span>
              )}
            </span>
            <input
              ref={dateInputRef}
              type="date"
              value={viewDate}
              onChange={(e) => e.target.value && setViewDate(e.target.value)}
              className="absolute opacity-0 pointer-events-none w-0 h-0 top-0 left-1/2"
            />
          </div>

          <button
            onClick={nextDay}
            className="w-7 h-7 flex items-center justify-center rounded-md text-base cursor-pointer bg-transparent transition-colors hover:bg-stone"
            style={{ border: '1px solid var(--color-hairline)', color: 'var(--color-slate)', lineHeight: 1 }}
          >›</button>
        </div>

        {/* Main area */}
        <div className="flex flex-1 overflow-hidden">
          <TimeGrid
            scheduledTasks={scheduled}
            startHour={settings.timelineStartHour}
            endHour={settings.timelineEndHour}
            activeId={activeId}
            onTaskClick={setSelectedTaskId}
            onSlotClick={handleSlotClick}
          />
          <UnscheduledPanel
            tasks={unscheduled}
            activeId={activeId}
            onTaskClick={setSelectedTaskId}
          />
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask && <MiniCard task={activeTask} />}
      </DragOverlay>
    </DndContext>
  )
}
