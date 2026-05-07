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

  const modeColor = isBreak ? '#22C55E' : '#F59E0B'

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5"
      style={{ background: 'rgba(14,14,14,0.97)' }}
    >
      {/* Mode label */}
      <div className="flex items-center gap-2">
        <Timer size={14} color={modeColor} />
        <span
          className="text-[12px] font-semibold tracking-[0.1em] uppercase"
          style={{ color: modeColor }}
        >
          {isBreak ? 'Break' : 'Focus'}
        </span>
      </div>

      {/* Task title */}
      <p
        className="text-[16px] m-0 max-w-[400px] text-center overflow-hidden text-ellipsis whitespace-nowrap"
        style={{ color: '#888888' }}
      >
        {isBreak
          ? `${task?.pomodoroSessions ?? ''} session${(task?.pomodoroSessions ?? 0) !== 1 ? 's' : ''} completed`
          : (task?.title ?? 'Focus session')}
      </p>

      {/* Timer */}
      <p
        className="text-[88px] font-extralight m-0 tracking-[0.04em]"
        style={{
          color: '#FFFFFF',
          fontVariantNumeric: 'tabular-nums',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {display}
      </p>

      {/* End / Skip button */}
      <button
        onClick={handleEnd}
        className="mt-4 bg-transparent rounded-lg px-7 py-2.5 text-[13px] cursor-pointer transition-[border-color,color] duration-150"
        style={{
          border: `1px solid ${confirmEnd ? '#DC2626' : '#333'}`,
          color: confirmEnd ? '#DC2626' : '#555',
        }}
      >
        {confirmEnd ? 'Confirm end' : isBreak ? 'Skip break' : 'End session'}
      </button>

      {confirmEnd && (
        <button
          onClick={() => setConfirmEnd(false)}
          className="bg-transparent border-none text-[12px] cursor-pointer"
          style={{ color: '#444' }}
        >
          Cancel
        </button>
      )}
    </div>
  )
}
