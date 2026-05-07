'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { type Task } from '@/store/tasks'
import TimeBlock from './TimeBlock'

interface Props {
  scheduledTasks: Task[]
  startHour: number
  endHour: number
  activeId: string | null
  onTaskClick: (id: string) => void
  onSlotClick: (hour: number, minute: number) => void
}

function durationToPx(minutes: number): number {
  return Math.max(28, (minutes / 60) * 60)
}

function timeToMins(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

interface OverlapGroup {
  tasks: Task[]
  endMins: number
}

function buildOverlapGroups(tasks: Task[]): Map<string, { colIdx: number; totalCols: number }> {
  const sorted = [...tasks].sort((a, b) =>
    timeToMins(a.scheduledTime!) - timeToMins(b.scheduledTime!)
  )
  const layout = new Map<string, { colIdx: number; totalCols: number }>()
  const groups: OverlapGroup[] = []

  for (const task of sorted) {
    const startMins = timeToMins(task.scheduledTime!)
    const endMins = startMins + (task.duration ?? 30)
    let placed = false
    for (const group of groups) {
      if (startMins < group.endMins) {
        group.tasks.push(task)
        group.endMins = Math.max(group.endMins, endMins)
        placed = true
        break
      }
    }
    if (!placed) groups.push({ tasks: [task], endMins })
  }

  for (const group of groups) {
    const total = group.tasks.length
    group.tasks.forEach((t, i) => layout.set(t.id, { colIdx: i, totalCols: total }))
  }

  return layout
}

function DroppableSlot({ hour, minute, onSlotClick }: {
  hour: number; minute: number; onSlotClick: (h: number, m: number) => void
}) {
  const id = `slot-${hour}-${minute}`
  const { isOver, setNodeRef } = useDroppable({ id })
  const isHalfHour = minute === 30
  const [hovered, setHovered] = useState(false)
  const label = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

  return (
    <div
      ref={setNodeRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="h-[30px] relative transition-colors duration-100"
      style={{
        borderTop: isHalfHour
          ? '1px dashed var(--color-hairline)'
          : '1px solid var(--color-hairline)',
        background: isOver ? 'var(--badge-q2-bg)' : hovered ? 'var(--color-stone)' : 'transparent',
      }}
    >
      {hovered && !isOver && (
        <button
          onClick={() => onSlotClick(hour, minute)}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] cursor-pointer z-10"
          style={{
            background: 'var(--color-canvas)',
            border: '1px solid var(--color-hairline)',
            color: 'var(--color-slate)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <span className="text-[13px] leading-none" style={{ color: 'var(--color-blue-action)' }}>+</span>
          {label}
        </button>
      )}
    </div>
  )
}

export default function TimeGrid({ scheduledTasks, startHour, endHour, activeId, onTaskClick, onSlotClick }: Props) {
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i)
  const layout = buildOverlapGroups(scheduledTasks)

  return (
    <div className="flex-1 overflow-y-auto relative min-w-0">
      <div className="relative">
        {hours.map((hour) => (
          <div key={hour} className="flex">
            {/* Hour label */}
            <div
              className="w-[52px] shrink-0 pt-1 pr-2.5 text-right text-[11px] font-medium select-none"
              style={{ color: 'var(--color-muted)' }}
            >
              {String(hour).padStart(2, '0')}:00
            </div>

            {/* Two 30-min slots */}
            <div className="flex-1 relative">
              <DroppableSlot hour={hour} minute={0} onSlotClick={onSlotClick} />
              <DroppableSlot hour={hour} minute={30} onSlotClick={onSlotClick} />
            </div>
          </div>
        ))}

        {/* Absolutely positioned task blocks */}
        <div className="absolute top-0 right-0 bottom-0 pointer-events-none" style={{ left: 52 }}>
          {scheduledTasks.map((task) => {
            if (!task.scheduledTime) return null
            const startMins = timeToMins(task.scheduledTime)
            const relMins = startMins - startHour * 60
            const top = (relMins / 60) * 60
            const height = durationToPx(task.duration ?? 30)
            const col = layout.get(task.id)
            const totalCols = col?.totalCols ?? 1
            const colIdx = col?.colIdx ?? 0
            const widthPct = 100 / totalCols
            const leftPct = colIdx * widthPct

            return (
              <div
                key={task.id}
                className="absolute pointer-events-auto transition-opacity duration-150"
                style={{
                  top,
                  height,
                  left: `calc(${leftPct}% + 2px)`,
                  width: `calc(${widthPct}% - 4px)`,
                  opacity: task.id === activeId ? 0.35 : 1,
                }}
              >
                <TimeBlock task={task} onTaskClick={onTaskClick} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
