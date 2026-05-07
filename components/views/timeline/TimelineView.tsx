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
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

        {/* Date nav bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 20px', borderBottom: '1px solid #E8E6E0',
          background: '#FFFFFF', flexShrink: 0,
        }}>
          <button onClick={prevDay} style={navBtnStyle}>‹</button>
          <div style={{ position: 'relative', minWidth: 200, textAlign: 'center' }}>
            <span
              onClick={() => dateInputRef.current?.showPicker()}
              style={{
                fontSize: 14, fontWeight: 500, color: '#141414',
                cursor: 'pointer', userSelect: 'none',
              }}
            >
              {displayDate}
              {isToday && (
                <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: '#2563EB',
                  background: '#EFF6FF', padding: '2px 6px', borderRadius: 4 }}>
                  TODAY
                </span>
              )}
            </span>
            <input
              ref={dateInputRef}
              type="date"
              value={viewDate}
              onChange={(e) => e.target.value && setViewDate(e.target.value)}
              style={{
                position: 'absolute', opacity: 0, pointerEvents: 'none',
                width: 0, height: 0, top: 0, left: '50%',
              }}
            />
          </div>
          <button onClick={nextDay} style={navBtnStyle}>›</button>
        </div>

        {/* Main area */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <TimeGrid
            scheduledTasks={scheduled}
            startHour={settings.timelineStartHour}
            endHour={settings.timelineEndHour}
            activeId={activeId}
            onTaskClick={setSelectedTaskId}
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

const navBtnStyle: React.CSSProperties = {
  background: 'none', border: '1px solid #E8E6E0', borderRadius: 6,
  width: 28, height: 28, cursor: 'pointer', fontSize: 16,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#555', lineHeight: 1,
}
