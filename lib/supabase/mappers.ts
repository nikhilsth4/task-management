import type { Task, Project } from '@/store/tasks'

export interface DbProject {
  id: string
  user_id: string
  title: string
  color: string
  created_at: string
}

export interface DbTask {
  id: string
  user_id: string
  project_id: string | null
  title: string
  notes: string
  urgency: 'high' | 'low'
  importance: 'high' | 'low'
  status: 'todo' | 'in_progress' | 'done'
  scheduled_date: string | null
  scheduled_time: string | null
  duration: number | null
  recurrence: 'none' | 'daily' | 'weekly' | 'weekdays' | 'custom'
  custom_days: number[]
  pomodoro_sessions: number
  tags: string[]
  created_at: string
  completed_at: string | null
}

export function dbToProject(row: DbProject): Project {
  return {
    id: row.id,
    title: row.title,
    color: row.color,
    createdAt: row.created_at,
  }
}

export function dbToTask(row: DbTask): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    notes: row.notes,
    urgency: row.urgency,
    importance: row.importance,
    status: row.status,
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time ? row.scheduled_time.slice(0, 5) : null,
    duration: row.duration,
    recurrence: row.recurrence,
    customDays: row.custom_days,
    pomodoroSessions: row.pomodoro_sessions,
    tags: row.tags,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  }
}

export function taskToDb(task: Partial<Task>): Partial<DbTask> {
  const row: Partial<DbTask> = {}
  if (task.projectId !== undefined) row.project_id = task.projectId
  if (task.title !== undefined) row.title = task.title
  if (task.notes !== undefined) row.notes = task.notes
  if (task.urgency !== undefined) row.urgency = task.urgency
  if (task.importance !== undefined) row.importance = task.importance
  if (task.status !== undefined) row.status = task.status
  if (task.scheduledDate !== undefined) row.scheduled_date = task.scheduledDate
  if (task.scheduledTime !== undefined) row.scheduled_time = task.scheduledTime
  if (task.duration !== undefined) row.duration = task.duration
  if (task.recurrence !== undefined) row.recurrence = task.recurrence
  if (task.customDays !== undefined) row.custom_days = task.customDays
  if (task.pomodoroSessions !== undefined) row.pomodoro_sessions = task.pomodoroSessions
  if (task.tags !== undefined) row.tags = task.tags
  if (task.completedAt !== undefined) row.completed_at = task.completedAt
  return row
}
