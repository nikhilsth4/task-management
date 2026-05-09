'use client'

import { format, isToday, isTomorrow, isYesterday, isPast, parseISO } from 'date-fns'
import { Plus } from 'lucide-react'
import { useTaskStore, type Task } from '@/store/tasks'
import { useUIStore } from '@/store/ui'
import { isoToday } from '@/lib/utils'

const STATUS_ICON: Record<string, string> = {
  todo: '○',
  in_progress: '●',
  done: '✓',
}

function dateLabel(date: string): string {
  const d = parseISO(date + 'T12:00:00')
  if (isYesterday(d)) return 'Yesterday'
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  if (isPast(d)) return `Overdue · ${format(d, 'MMM d')}`
  return format(d, 'EEE, MMM d')
}

interface Group {
  label: string
  tasks: Task[]
  overdue?: boolean
}

export default function ProjectTaskList({ projectId }: { projectId: string }) {
  const allTasks = useTaskStore((s) => s.tasks)
  const tasks = allTasks.filter((t) => t.projectId === projectId)
  const addTask = useTaskStore((s) => s.addTask)
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId)

  const today = isoToday()
  const active = tasks.filter((t) => t.status !== 'done')
  const done = tasks.filter((t) => t.status === 'done')

  // Group active tasks by scheduled date
  const grouped: Group[] = []
  const byDate = new Map<string, Task[]>()
  const unscheduled: Task[] = []

  for (const t of active) {
    if (!t.scheduledDate) {
      unscheduled.push(t)
    } else {
      const existing = byDate.get(t.scheduledDate) ?? []
      existing.push(t)
      byDate.set(t.scheduledDate, existing)
    }
  }

  // Sort dates: past first, then future
  const sortedDates = Array.from(byDate.keys()).sort()
  for (const date of sortedDates) {
    grouped.push({
      label: dateLabel(date),
      tasks: byDate.get(date)!,
      overdue: date < today,
    })
  }
  if (unscheduled.length > 0) {
    grouped.push({ label: 'No date', tasks: unscheduled })
  }

  function handleAddTask() {
    const task = addTask({ title: 'New task', projectId })
    setSelectedTaskId(task.id)
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <p className="text-[13px] m-0" style={{ color: 'var(--color-slate)' }}>
          No tasks yet
        </p>
        <button
          onClick={handleAddTask}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] cursor-pointer"
          style={{ border: '1px solid var(--color-hairline)', background: 'transparent', color: 'var(--color-slate)' }}
        >
          <Plus size={12} /> Add first task
        </button>
      </div>
    )
  }

  return (
    <div className="px-6 py-4">
      {grouped.map((group) => (
        <div key={group.label} className="mb-2">
          <div className="pt-3 pb-1.5">
            <span
              className="text-[11px] font-semibold tracking-widest uppercase"
              style={{ color: group.overdue ? '#dc2626' : 'var(--color-muted)' }}
            >
              {group.label}
            </span>
          </div>
          {group.tasks.map((t) => (
            <TaskRow key={t.id} task={t} onClick={() => setSelectedTaskId(t.id)} />
          ))}
        </div>
      ))}

      {done.length > 0 && (
        <div className="mb-2">
          <div className="pt-3 pb-1.5">
            <span
              className="text-[11px] font-semibold tracking-widest uppercase"
              style={{ color: 'var(--color-muted)' }}
            >
              Completed
            </span>
          </div>
          {done.map((t) => (
            <TaskRow key={t.id} task={t} onClick={() => setSelectedTaskId(t.id)} />
          ))}
        </div>
      )}

      <button
        onClick={handleAddTask}
        className="flex items-center gap-1.5 py-2 text-[12px] cursor-pointer border-none bg-transparent mt-1"
        style={{ color: 'var(--color-slate)' }}
      >
        <Plus size={12} /> Add task
      </button>
    </div>
  )
}

function TaskRow({ task, onClick }: { task: Task; onClick: () => void }) {
  const isDone = task.status === 'done'

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-2.5 px-0 text-left border-none bg-transparent cursor-pointer"
      style={{ borderBottom: '1px solid var(--color-hairline)' }}
    >
      <span
        className="text-[14px] shrink-0 w-4 text-center leading-none"
        style={{
          color: isDone
            ? 'var(--color-muted)'
            : task.status === 'in_progress'
              ? 'var(--color-blue-action)'
              : 'var(--color-slate)',
        }}
      >
        {STATUS_ICON[task.status]}
      </span>
      <span
        className="flex-1 text-[13px]"
        style={{
          color: isDone ? 'var(--color-muted)' : 'var(--color-ink)',
          textDecoration: isDone ? 'line-through' : 'none',
        }}
      >
        {task.title}
      </span>
      {task.urgency === 'high' && !isDone && (
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
          style={{ background: 'var(--badge-q1-bg)', color: 'var(--badge-q1-text)' }}
        >
          urgent
        </span>
      )}
    </button>
  )
}
