'use client'

import { useEffect, useRef } from 'react'
import { useUIStore } from '@/store/ui'
import ViewSwitcher from '@/components/layout/ViewSwitcher'
import QuickCapture from '@/components/task/QuickCapture'
import ListView from '@/components/views/ListView'
import MatrixView from '@/components/views/matrix/MatrixView'
import TaskDetail from '@/components/task/TaskDetail'

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
      <main style={{ flex: 1, overflowY: 'auto', background: '#F7F6F3' }}>
        {activeView === 'list' && <ListView />}
        {activeView === 'matrix' && <MatrixView />}
        {activeView === 'timeline' && (
          <div style={{ padding: 24, color: '#BBBBBB', fontSize: 14 }}>Timeline view — coming in Part 7</div>
        )}
        {activeView === 'kanban' && (
          <div style={{ padding: 24, color: '#BBBBBB', fontSize: 14 }}>Kanban view — coming in Part 8</div>
        )}
      </main>
      <TaskDetail />
    </div>
  )
}
