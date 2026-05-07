import { type Task } from '@/store/tasks'

export function generateId(): string {
  return crypto.randomUUID()
}

export function getQuadrant(
  urgency: Task['urgency'],
  importance: Task['importance']
): string {
  if (urgency === 'high' && importance === 'high') return 'urgent_important'
  if (urgency === 'low' && importance === 'high') return 'not_urgent_important'
  if (urgency === 'high' && importance === 'low') return 'urgent_not_important'
  return 'not_urgent_not_important'
}

export function getQuadrantPriority(urgency: Task['urgency'], importance: Task['importance']): number {
  const map: Record<string, number> = {
    urgent_important: 1,
    not_urgent_important: 2,
    urgent_not_important: 3,
    not_urgent_not_important: 4,
  }
  return map[getQuadrant(urgency, importance)]
}

export function isoNow(): string {
  return new Date().toISOString()
}

export function isoToday(): string {
  return new Date().toISOString().slice(0, 10)
}

export function formatTimeRange(scheduledTime: string, duration: number | null): string {
  const [h, m] = scheduledTime.split(':').map(Number)
  const start = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  if (!duration) return start
  const totalMins = h * 60 + m + duration
  const endH = Math.floor(totalMins / 60) % 24
  const endM = totalMins % 60
  return `${start} – ${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
}

