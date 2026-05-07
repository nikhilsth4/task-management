'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  TIMELINE_START_HOUR,
  TIMELINE_END_HOUR,
  POMODORO_WORK_MINUTES,
  POMODORO_BREAK_MINUTES,
} from '@/lib/constants'

export type View = 'list' | 'matrix' | 'timeline' | 'kanban'

interface PomodoroState {
  activeTaskId: string | null
  isRunning: boolean
  isBreak: boolean
  // Stores when the current session started rather than timeRemaining,
  // so elapsed time can be derived correctly after a page reload.
  startedAt: string | null
  workMinutes: number
  breakMinutes: number
}

interface Settings {
  // Controls how many hour rows TimelineView renders.
  timelineStartHour: number
  timelineEndHour: number
}

interface UIState {
  // Which of the four view tabs is currently visible.
  activeView: View
  // ID of the task whose TaskDetail drawer is open; null means drawer is closed.
  selectedTaskId: string | null
  // 'all' = no filter, '' = inbox, projectId = specific project
  filterProjectId: string
  pomodoro: PomodoroState
  settings: Settings
  // ISO date of the last time recurring tasks were generated (checked on app load).
  lastRecurrenceCheck: string | null

  setActiveView: (view: View) => void
  setSelectedTaskId: (id: string | null) => void
  setFilterProjectId: (id: string) => void

  // Begins a 25-min work session for the given task.
  startPomodoro: (taskId: string) => void
  // User-initiated early exit — resets all pomodoro state without crediting a session.
  stopPomodoro: () => void
  // Called when the timer naturally reaches zero.
  // Work session → starts a break. Break → resets fully.
  completePomodoro: () => void
  updateSettings: (patch: Partial<Settings>) => void
  updatePomodoroSettings: (patch: Partial<Pick<PomodoroState, 'workMinutes' | 'breakMinutes'>>) => void
  setLastRecurrenceCheck: (date: string) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      activeView: 'list',
      selectedTaskId: null,
      filterProjectId: 'all',
      lastRecurrenceCheck: null,

      pomodoro: {
        activeTaskId: null,
        isRunning: false,
        isBreak: false,
        startedAt: null,
        workMinutes: POMODORO_WORK_MINUTES,
        breakMinutes: POMODORO_BREAK_MINUTES,
      },

      settings: {
        timelineStartHour: TIMELINE_START_HOUR,
        timelineEndHour: TIMELINE_END_HOUR,
      },

      setActiveView: (view) => set({ activeView: view }),

      setSelectedTaskId: (id) => set({ selectedTaskId: id }),

      setFilterProjectId: (id) => set({ filterProjectId: id }),

      startPomodoro: (taskId) => {
        set((s) => ({
          pomodoro: {
            ...s.pomodoro,
            activeTaskId: taskId,
            isRunning: true,
            isBreak: false,
            startedAt: new Date().toISOString(),
          },
        }))
      },

      stopPomodoro: () => {
        set((s) => ({
          pomodoro: {
            ...s.pomodoro,
            activeTaskId: null,
            isRunning: false,
            isBreak: false,
            startedAt: null,
          },
        }))
      },

      completePomodoro: () => {
        const { pomodoro } = get()
        if (pomodoro.isBreak) {
          // Break is over — full reset, no active task.
          set((s) => ({
            pomodoro: {
              ...s.pomodoro,
              isRunning: false,
              isBreak: false,
              startedAt: null,
              activeTaskId: null,
            },
          }))
        } else {
          // Work session done — flip to break, stamp a new startedAt.
          set((s) => ({
            pomodoro: {
              ...s.pomodoro,
              isBreak: true,
              startedAt: new Date().toISOString(),
            },
          }))
        }
      },

      updateSettings: (patch) => {
        set((s) => ({ settings: { ...s.settings, ...patch } }))
      },

      updatePomodoroSettings: (patch) => {
        set((s) => ({ pomodoro: { ...s.pomodoro, ...patch } }))
      },

      setLastRecurrenceCheck: (date) => set({ lastRecurrenceCheck: date }),
    }),
    // Persists the entire UI store to localStorage so active view,
    // pomodoro session, and settings survive page reload.
    { name: 'ui' }
  )
)
