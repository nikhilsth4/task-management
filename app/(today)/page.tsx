'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore } from '@/store/ui'
import { useTaskStore } from '@/store/tasks'
import { isoToday, generateId, isoNow } from '@/lib/utils'
import { isDueToday, buildInstance } from '@/lib/recurrence'
import ViewSwitcher from '@/components/layout/ViewSwitcher'
import QuickCapture from '@/components/task/QuickCapture'
import ListView from '@/components/views/ListView'
import MatrixView from '@/components/views/matrix/MatrixView'
import TimelineView from '@/components/views/timeline/TimelineView'
import KanbanView from '@/components/views/kanban/KanbanView'
import TaskDetail from '@/components/task/TaskDetail'
import PomodoroOverlay from '@/components/pomodoro/PomodoroOverlay'

export default function TodayPage() {
  const activeView = useUIStore((s) => s.activeView)
  const selectedTaskId = useUIStore((s) => s.selectedTaskId)
  const lastRecurrenceCheck = useUIStore((s) => s.lastRecurrenceCheck)
  const setLastRecurrenceCheck = useUIStore((s) => s.setLastRecurrenceCheck)
  const tasks = useTaskStore((s) => s.tasks)
  const addTask = useTaskStore((s) => s.addTask)
  const updateTask = useTaskStore((s) => s.updateTask)
  const captureRef = useRef<HTMLInputElement>(null)

  // On app load: roll over unfinished tasks and generate recurring instances
  useEffect(() => {
    const today = isoToday()

    // Roll over unfinished scheduled tasks from past days to today
    for (const task of tasks) {
      if (task.scheduledDate && task.scheduledDate < today && task.status !== 'done' && task.recurrence === 'none') {
        updateTask(task.id, { scheduledDate: today, status: 'todo', completedAt: null })
      }
    }

    // Generate recurring instances once per day
    if (lastRecurrenceCheck === today) return
    const templates = tasks.filter((t) => t.recurrence !== 'none')
    for (const template of templates) {
      if (isDueToday(template, today)) {
        const instance = buildInstance(template, today, generateId, isoNow)
        addTask({ ...instance })
      }
    }
    setLastRecurrenceCheck(today)
  }, [])

  // Focus QuickCapture when / or N pressed outside an input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === '/' || e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        captureRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <QuickCapture ref={captureRef} />
      <ViewSwitcher />
      <main style={{
        flex: 1, background: '#F7F6F3',
        overflowY: (activeView === 'timeline' || activeView === 'kanban') ? 'hidden' : 'auto',
        display: (activeView === 'timeline' || activeView === 'kanban') ? 'flex' : 'block',
        flexDirection: 'column',
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}
          >
            {activeView === 'list' && <ListView />}
            {activeView === 'matrix' && <MatrixView />}
            {activeView === 'timeline' && <TimelineView />}
            {activeView === 'kanban' && <KanbanView />}
          </motion.div>
        </AnimatePresence>
      </main>
      <AnimatePresence>{selectedTaskId && <TaskDetail />}</AnimatePresence>
      <PomodoroOverlay />
    </div>
  )
}
