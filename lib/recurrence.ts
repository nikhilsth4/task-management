import { type Task, type Recurrence } from '@/store/tasks'

// Returns the next ISO date string on which a recurring task is due, starting from the day after fromDate.
export function nextOccurrenceDate(
  recurrence: Recurrence,
  customDays: number[],
  fromDate: string
): string | null {
  if (recurrence === 'none') return null

  const from = new Date(fromDate + 'T12:00:00')

  for (let i = 1; i <= 14; i++) {
    const candidate = new Date(from)
    candidate.setDate(from.getDate() + i)
    const dow = candidate.getDay()

    if (recurrence === 'daily') return candidate.toISOString().slice(0, 10)
    if (recurrence === 'weekdays' && dow >= 1 && dow <= 5) return candidate.toISOString().slice(0, 10)
    if (recurrence === 'weekly' && dow === from.getDay()) return candidate.toISOString().slice(0, 10)
    if (recurrence === 'custom' && (customDays ?? []).includes(dow)) return candidate.toISOString().slice(0, 10)
  }

  return null
}

// Builds a new task instance from a recurring template scheduled for nextDate.
export function buildInstance(template: Task, nextDate: string, generateId: () => string, isoNow: () => string): Task {
  return {
    ...template,
    id: generateId(),
    scheduledDate: nextDate,
    scheduledTime: template.scheduledTime,
    status: 'todo',
    completedAt: null,
    pomodoroSessions: 0,
    createdAt: isoNow(),
    recurrence: 'none',
    customDays: [],
  }
}
