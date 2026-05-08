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

interface PlanSuggestion {
  taskId: string
  scheduledTime: string
  duration: number
  title: string
}

export default function TimelineView() {
  const allTasks = useTaskStore((s) => s.tasks)
  const addTask = useTaskStore((s) => s.addTask)
  const updateTask = useTaskStore((s) => s.updateTask)
  const settings = useUIStore((s) => s.settings)
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId)
  const filterProjectId = useUIStore((s) => s.filterProjectId)
  const aiEnabled = useUIStore((s) => s.aiEnabled)

  const [viewDate, setViewDate] = useState(isoToday())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showUnscheduled, setShowUnscheduled] = useState(false)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState<string | null>(null)
  const [planSuggestions, setPlanSuggestions] = useState<PlanSuggestion[]>([])
  const [planAccepted, setPlanAccepted] = useState<boolean[]>([])
  const [planModalOpen, setPlanModalOpen] = useState(false)

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

  async function handlePlanDay() {
    setPlanLoading(true)
    setPlanError(null)
    try {
      const workStart = `${String(settings.timelineStartHour).padStart(2, '0')}:00`
      const workEnd = `${String(settings.timelineEndHour).padStart(2, '0')}:00`

      const tasksPayload = unscheduled.map((t) => ({
        id: t.id,
        title: t.title,
        duration: t.duration ?? 30,
        urgency: t.urgency,
        importance: t.importance,
      }))

      const scheduledPayload = scheduled.map((t) => ({
        title: t.title,
        scheduledTime: t.scheduledTime,
        duration: t.duration ?? 30,
      }))

      const res = await fetch('/api/ai/plan-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: tasksPayload, scheduledTasks: scheduledPayload, workStart, workEnd }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        setPlanError('AI failed — try again')
        return
      }

      const suggestions: PlanSuggestion[] = data.schedule
        .map((s: { taskId: string; scheduledTime: string; duration: number }) => {
          const task = allTasks.find((t) => t.id === s.taskId)
          if (!task) return null
          return { taskId: s.taskId, scheduledTime: s.scheduledTime, duration: s.duration, title: task.title }
        })
        .filter(Boolean) as PlanSuggestion[]

      if (suggestions.length === 0) {
        setPlanError('No suggestions could be scheduled in your work window')
        return
      }

      setPlanSuggestions(suggestions)
      setPlanAccepted(suggestions.map(() => true))
      setPlanModalOpen(true)
    } catch {
      setPlanError('AI failed — try again')
    } finally {
      setPlanLoading(false)
    }
  }

  function applyPlan() {
    planSuggestions.forEach((s, i) => {
      if (planAccepted[i]) {
        updateTask(s.taskId, {
          scheduledDate: viewDate,
          scheduledTime: s.scheduledTime,
          duration: s.duration,
        })
      }
    })
    setPlanModalOpen(false)
    setPlanSuggestions([])
    setPlanAccepted([])
  }

  function closePlanModal() {
    setPlanModalOpen(false)
    setPlanSuggestions([])
    setPlanAccepted([])
    setPlanError(null)
  }

  const isToday = viewDate === isoToday()
  const displayDate = new Date(viewDate + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const showPlanButton = aiEnabled && unscheduled.length > 0

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full overflow-hidden">

        {/* Date nav bar */}
        <div
          className="flex items-center gap-3 px-5 py-2.5 shrink-0 flex-wrap"
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

          {showPlanButton && (
            <button
              onClick={handlePlanDay}
              disabled={planLoading}
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] cursor-pointer transition-all duration-150 disabled:opacity-50"
              style={{ border: '1px solid var(--color-hairline)', background: 'transparent', color: 'var(--color-slate)' }}
            >
              {planLoading ? '…' : '✨'} {planLoading ? 'Planning…' : 'Plan my day'}
            </button>
          )}

          {planError && (
            <span className="text-[12px] text-red-500">{planError}</span>
          )}

          {/* Unscheduled toggle — mobile only */}
          <button
            onClick={() => setShowUnscheduled((v) => !v)}
            className="ml-auto sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] cursor-pointer transition-colors"
            style={{
              background: showUnscheduled ? 'var(--badge-q2-bg)' : 'var(--color-stone)',
              border: '1px solid var(--color-hairline)',
              color: showUnscheduled ? 'var(--color-blue-action)' : 'var(--color-slate)',
            }}
          >
            Inbox
            {unscheduled.length > 0 && (
              <span className="font-semibold">{unscheduled.length}</span>
            )}
          </button>
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
          <div className={`${showUnscheduled ? 'flex' : 'hidden'} sm:flex flex-col`}>
            <UnscheduledPanel
              tasks={unscheduled}
              activeId={activeId}
              onTaskClick={setSelectedTaskId}
            />
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask && <MiniCard task={activeTask} />}
      </DragOverlay>

      {/* Plan My Day modal */}
      {planModalOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.3)' }}
            onClick={closePlanModal}
          />
          <div
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl overflow-hidden flex flex-col"
            style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', maxHeight: '80vh' }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid var(--color-hairline)' }}>
              <span className="text-[14px] font-semibold" style={{ color: 'var(--color-ink)' }}>✨ Suggested schedule</span>
              <button onClick={closePlanModal} className="text-[18px] bg-transparent border-none cursor-pointer leading-none" style={{ color: 'var(--color-slate)' }}>×</button>
            </div>

            {/* Suggestions list */}
            <div className="flex-1 overflow-y-auto">
              {planSuggestions.map((s, i) => (
                <label
                  key={s.taskId}
                  className="flex items-center gap-3 px-5 py-3 cursor-pointer"
                  style={{ borderBottom: i < planSuggestions.length - 1 ? '1px solid var(--color-hairline)' : undefined }}
                >
                  <input
                    type="checkbox"
                    checked={planAccepted[i] ?? false}
                    onChange={(e) => setPlanAccepted((prev) => prev.map((v, j) => j === i ? e.target.checked : v))}
                    className="w-4 h-4 cursor-pointer accent-green-600 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium m-0 truncate" style={{ color: 'var(--color-ink)' }}>{s.title}</p>
                    <p className="text-[11px] m-0 mt-0.5" style={{ color: 'var(--color-slate)' }}>
                      {s.scheduledTime} · {s.duration} min
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-5 py-4 shrink-0 gap-3" style={{ borderTop: '1px solid var(--color-hairline)' }}>
              <button onClick={closePlanModal} className="px-4 py-1.5 rounded-md text-[12px] cursor-pointer bg-transparent" style={{ border: '1px solid var(--color-hairline)', color: 'var(--color-slate)' }}>
                Dismiss
              </button>
              <button
                onClick={applyPlan}
                disabled={!planAccepted.some(Boolean)}
                className="flex-1 px-4 py-1.5 rounded-md text-[12px] font-medium cursor-pointer border-none disabled:opacity-40"
                style={{ background: 'var(--color-ink)', color: 'var(--color-canvas)' }}
              >
                Apply {planAccepted.filter(Boolean).length} task{planAccepted.filter(Boolean).length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </>
      )}
    </DndContext>
  )
}
