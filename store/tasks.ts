'use client'

import { create } from 'zustand'
import { isoNow, isoToday } from '@/lib/utils'
import { DEFAULT_TASK_DURATION } from '@/lib/constants'
import { nextOccurrenceDate, buildInstance } from '@/lib/recurrence'
import { createClient } from '@/lib/supabase/client'
import { dbToTask, taskToDb } from '@/lib/supabase/mappers'

export type Recurrence = 'none' | 'daily' | 'weekly' | 'weekdays' | 'custom'
export type Status = 'todo' | 'in_progress' | 'done'
export type Urgency = 'high' | 'low'
export type Importance = 'high' | 'low'

export interface Task {
  id: string
  projectId: string | null
  title: string
  notes: string
  urgency: Urgency
  importance: Importance
  status: Status
  scheduledDate: string | null
  scheduledTime: string | null
  duration: number | null
  recurrence: Recurrence
  customDays: number[]
  pomodoroSessions: number
  tags: string[]
  createdAt: string
  completedAt: string | null
}

interface TasksState {
  tasks: Task[]
  loading: boolean
  fetchTasks: () => Promise<void>
  addTask: (partial: Partial<Task> & { title: string }) => Task
  updateTask: (id: string, patch: Partial<Task>) => void
  deleteTask: (id: string) => void
  deleteTasksByProject: (projectId: string) => void
  completeTask: (id: string) => void
}

export const selectActiveTasks = (tasks: Task[]) => tasks.filter((t) => t.recurrence === 'none')

export const useTaskStore = create<TasksState>()((set, get) => ({
  tasks: [],
  loading: false,

  fetchTasks: async () => {
    set({ loading: true })
    const supabase = createClient()
    const { data, error } = await supabase.from('tasks').select('*').order('created_at')
    if (error) { console.error('fetchTasks:', error); set({ loading: false }); return }
    set({ tasks: (data ?? []).map(dbToTask), loading: false })
  },

  addTask: (partial) => {
    const task: Task = {
      id: crypto.randomUUID(),
      projectId: partial.projectId ?? null,
      title: partial.title,
      notes: partial.notes ?? '',
      urgency: partial.urgency ?? 'low',
      importance: partial.importance ?? 'low',
      status: partial.status ?? 'todo',
      scheduledDate: partial.scheduledDate ?? null,
      scheduledTime: partial.scheduledTime ?? null,
      duration: partial.duration ?? DEFAULT_TASK_DURATION,
      recurrence: partial.recurrence ?? 'none',
      customDays: partial.customDays ?? [],
      pomodoroSessions: partial.pomodoroSessions ?? 0,
      tags: partial.tags ?? [],
      createdAt: isoNow(),
      completedAt: null,
    }
    set((s) => ({ tasks: [...s.tasks, task] }))
    const supabase = createClient()
    supabase.from('tasks').insert({ id: task.id, ...taskToDb(task), created_at: task.createdAt })
      .then(({ error }) => { if (error) console.error('addTask:', error) })
    return task
  },

  updateTask: (id, patch) => {
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }))
    const supabase = createClient()
    supabase.from('tasks').update(taskToDb(patch)).eq('id', id)
      .then(({ error }) => { if (error) console.error('updateTask:', error) })
  },

  deleteTask: (id) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
    const supabase = createClient()
    supabase.from('tasks').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('deleteTask:', error) })
  },

  deleteTasksByProject: (projectId) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t.projectId !== projectId) }))
    const supabase = createClient()
    supabase.from('tasks').delete().eq('project_id', projectId)
      .then(({ error }) => { if (error) console.error('deleteTasksByProject:', error) })
  },

  completeTask: (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return

    const completedAt = isoNow()
    const completed = { ...task, status: 'done' as const, completedAt }

    let nextInstance: Task | null = null
    if (task.recurrence !== 'none') {
      const fromDate = task.scheduledDate ?? isoToday()
      const nextDate = nextOccurrenceDate(task.recurrence, task.customDays ?? [], fromDate)
      if (nextDate) {
        nextInstance = buildInstance(task, nextDate, () => crypto.randomUUID(), isoNow)
      }
    }

    set((s) => {
      const updated = s.tasks.map((t) => (t.id === id ? completed : t))
      return { tasks: nextInstance ? [...updated, nextInstance] : updated }
    })

    const supabase = createClient()
    supabase.from('tasks').update({ status: 'done', completed_at: completedAt }).eq('id', id)
      .then(({ error }) => { if (error) console.error('completeTask:', error) })

    if (nextInstance) {
      supabase.from('tasks').insert({ id: nextInstance.id, ...taskToDb(nextInstance), created_at: nextInstance.createdAt })
        .then(({ error }) => { if (error) console.error('completeTask insert instance:', error) })
    }
  },
}))
