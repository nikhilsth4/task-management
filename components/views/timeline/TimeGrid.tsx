'use client'

import { useDroppable } from '@dnd-kit/core'
import { type Task } from '@/store/tasks'
import TimeBlock from './TimeBlock'

interface Props {
  scheduledTasks: Task[]
  startHour: number
  endHour: number
  activeId: string | null
  onTaskClick: (id: string) => void
}

// Returns pixel height for a duration in minutes. 1 hour = 60px.
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
    if (!placed) {
      groups.push({ tasks: [task], endMins })
    }
  }

  for (const group of groups) {
    const total = group.tasks.length
    group.tasks.forEach((t, i) => {
      layout.set(t.id, { colIdx: i, totalCols: total })
    })
  }

  return layout
}

function DroppableSlot({ hour, minute }: { hour: number; minute: number }) {
  const id = `slot-${hour}-${minute}`
  const { isOver, setNodeRef } = useDroppable({ id })
  const isHalfHour = minute === 30

  return (
    <div
      ref={setNodeRef}
      style={{
        height: 30,
        borderTop: isHalfHour ? '1px dashed #F0EEE8' : '1px solid #ECEAE4',
        background: isOver ? '#EFF6FF' : 'transparent',
        transition: 'background 0.12s',
      }}
    />
  )
}

export default function TimeGrid({ scheduledTasks, startHour, endHour, activeId, onTaskClick }: Props) {
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i)
  const layout = buildOverlapGroups(scheduledTasks)

  return (
    <div style={{ flex: 1, overflowY: 'auto', position: 'relative', minWidth: 0 }}>
      <div style={{ position: 'relative' }}>
        {hours.map((hour) => (
          <div key={hour} style={{ display: 'flex' }}>
            {/* Hour label */}
            <div style={{
              width: 52, flexShrink: 0,
              paddingTop: 4, paddingRight: 10,
              textAlign: 'right',
              fontSize: 11, color: '#AAAAAA', fontWeight: 500,
              userSelect: 'none',
            }}>
              {String(hour).padStart(2, '0')}:00
            </div>

            {/* Two 30-min droppable slots stacked */}
            <div style={{ flex: 1, position: 'relative' }}>
              <DroppableSlot hour={hour} minute={0} />
              <DroppableSlot hour={hour} minute={30} />
            </div>
          </div>
        ))}

        {/* Placed task blocks — absolutely positioned over the grid */}
        <div style={{
          position: 'absolute', top: 0, left: 52, right: 0, bottom: 0,
          pointerEvents: 'none',
        }}>
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
                style={{
                  position: 'absolute',
                  top,
                  height,
                  left: `calc(${leftPct}% + 2px)`,
                  width: `calc(${widthPct}% - 4px)`,
                  pointerEvents: 'auto',
                  opacity: task.id === activeId ? 0.35 : 1,
                  transition: 'opacity 0.15s',
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
