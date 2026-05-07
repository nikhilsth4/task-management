'use client'

import { useEffect, useRef } from 'react'
import { useUIStore } from '@/store/ui'
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
  const captureRef = useRef<HTMLInputElement>(null)

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
        {activeView === 'list' && <ListView />}
        {activeView === 'matrix' && <MatrixView />}
        {activeView === 'timeline' && <TimelineView />}
        {activeView === 'kanban' && <KanbanView />}
      </main>
      <TaskDetail />
      <PomodoroOverlay />
    </div>
  )
}
