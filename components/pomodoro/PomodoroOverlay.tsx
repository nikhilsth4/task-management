'use client'

import { useEffect, useRef, useState } from 'react'
import { Timer } from 'lucide-react'
import { useUIStore } from '@/store/ui'
import { useTaskStore } from '@/store/tasks'

export default function PomodoroOverlay() {
  const pomodoro = useUIStore((s) => s.pomodoro)
  const tasks = useTaskStore((s) => s.tasks)

  const [remaining, setRemaining] = useState(0)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const completedRef = useRef(false)

  const { isRunning, isBreak, startedAt, activeTaskId } = pomodoro
  const task = tasks.find((t) => t.id === activeTaskId)

  useEffect(() => {
    if (!isRunning || !startedAt) return
    completedRef.current = false
    setConfirmEnd(false)

    function tick() {
      const { pomodoro: p } = useUIStore.getState()
      if (!p.isRunning || !p.startedAt) return

      const totalSecs = (p.isBreak ? p.breakMinutes : p.workMinutes) * 60
      const elapsed = (Date.now() - new Date(p.startedAt).getTime()) / 1000
      const rem = Math.max(0, totalSecs - elapsed)
      setRemaining(rem)

      if (rem <= 0 && !completedRef.current) {
        completedRef.current = true
        // Credit the session only when a work session naturally completes
        if (!p.isBreak && p.activeTaskId) {
          const t = useTaskStore.getState().tasks.find((t) => t.id === p.activeTaskId)
          if (t) {
            useTaskStore.getState().updateTask(p.activeTaskId, {
              pomodoroSessions: t.pomodoroSessions + 1,
            })
          }
        }
        useUIStore.getState().completePomodoro()
      }
    }

    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [isRunning, startedAt])

  if (!isRunning) return null

  const minutes = Math.floor(remaining / 60)
  const seconds = Math.floor(remaining % 60)
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  function handleEnd() {
    if (!confirmEnd) { setConfirmEnd(true); return }
    useUIStore.getState().stopPomodoro()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(14, 14, 14, 0.97)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 20,
    }}>
      {/* Mode label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Timer size={14} color={isBreak ? '#22C55E' : '#F59E0B'} />
        <span style={{
          fontSize: 12, fontWeight: 600, letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: isBreak ? '#22C55E' : '#F59E0B',
        }}>
          {isBreak ? 'Break' : 'Focus'}
        </span>
      </div>

      {/* Task title */}
      <p style={{
        fontSize: 16, color: '#888888', margin: 0,
        maxWidth: 400, textAlign: 'center',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {isBreak
          ? `${task?.pomodoroSessions ?? ''} session${(task?.pomodoroSessions ?? 0) !== 1 ? 's' : ''} completed`
          : (task?.title ?? 'Focus session')}
      </p>

      {/* Timer */}
      <p style={{
        fontSize: 88, fontWeight: 200, color: '#FFFFFF',
        margin: 0, letterSpacing: '0.04em',
        fontVariantNumeric: 'tabular-nums',
        fontFamily: 'var(--font-geist-mono)',
      }}>
        {display}
      </p>

      {/* End / Skip button */}
      <button
        onClick={handleEnd}
        style={{
          marginTop: 16,
          background: 'none',
          border: `1px solid ${confirmEnd ? '#DC2626' : '#333'}`,
          color: confirmEnd ? '#DC2626' : '#555',
          borderRadius: 8,
          padding: '10px 28px',
          fontSize: 13,
          cursor: 'pointer',
          transition: 'border-color 0.15s, color 0.15s',
        }}
      >
        {confirmEnd
          ? 'Confirm end'
          : isBreak ? 'Skip break' : 'End session'}
      </button>

      {confirmEnd && (
        <button
          onClick={() => setConfirmEnd(false)}
          style={{
            background: 'none', border: 'none',
            color: '#444', fontSize: 12, cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      )}
    </div>
  )
}
