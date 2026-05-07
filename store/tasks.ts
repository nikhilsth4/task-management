'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateId, isoNow } from '@/lib/utils'
import { DEFAULT_TASK_DURATION } from '@/lib/constants'

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
  pomodoroSessions: number
  tags: string[]
  createdAt: string
  completedAt: string | null
}

interface TasksState {
  tasks: Task[]
  addTask: (partial: Partial<Task> & { title: string }) => Task
  updateTask: (id: string, patch: Partial<Task>) => void
  deleteTask: (id: string) => void
  deleteTasksByProject: (projectId: string) => void
  completeTask: (id: string) => void
}

export const useTaskStore = create<TasksState>()(
  persist(
    (set) => ({
      tasks: [],

      addTask: (partial) => {
        const task: Task = {
          id: generateId(),
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
          pomodoroSessions: partial.pomodoroSessions ?? 0,
          tags: partial.tags ?? [],
          createdAt: isoNow(),
          completedAt: null,
        }
        set((s) => ({ tasks: [...s.tasks, task] }))
        return task
      },

      updateTask: (id, patch) => {
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }))
      },

      deleteTask: (id) => {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
      },

      deleteTasksByProject: (projectId) => {
        set((s) => ({ tasks: s.tasks.filter((t) => t.projectId !== projectId) }))
      },

      completeTask: (id) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, status: 'done', completedAt: isoNow() } : t
          ),
        }))
      },
    }),
    { name: 'tasks' }
  )
)
