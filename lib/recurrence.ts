import { type Task } from '@/store/tasks'

// Returns true if a recurring task template is due on the given date.
export function isDueToday(task: Task, todayStr: string): boolean {
  if (task.recurrence === 'none') return false

  const today = new Date(todayStr + 'T12:00:00')
  const dayOfWeek = today.getDay() // 0=Sun, 1=Mon ... 6=Sat

  if (task.recurrence === 'daily') return true

  if (task.recurrence === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5

  if (task.recurrence === 'weekly') {
    const origin = new Date((task.scheduledDate ?? task.createdAt.slice(0, 10)) + 'T12:00:00')
    return origin.getDay() === dayOfWeek
  }

  if (task.recurrence === 'custom') {
    return (task.customDays ?? []).includes(dayOfWeek)
  }

  return false
}

// Builds a new task instance from a recurring template.
export function buildInstance(template: Task, todayStr: string, generateId: () => string, isoNow: () => string): Task {
  return {
    ...template,
    id: generateId(),
    scheduledDate: todayStr,
    status: 'todo',
    completedAt: null,
    pomodoroSessions: 0,
    createdAt: isoNow(),
    recurrence: 'none', // instances are one-off copies; the template holds the recurrence
    customDays: [],
  }
}
