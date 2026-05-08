'use client'

import { forwardRef, useState } from 'react'
import { useTaskStore } from '@/store/tasks'
import { useUIStore } from '@/store/ui'

const QuickCapture = forwardRef<HTMLInputElement>(function QuickCapture(_, ref) {
  const [value, setValue] = useState('')
  const [added, setAdded] = useState(false)
  const [aiLoading, setAILoading] = useState(false)
  const [aiError, setAIError] = useState<string | null>(null)

  const addTask = useTaskStore((s) => s.addTask)
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId)
  const aiEnabled = useUIStore((s) => s.aiEnabled)
  const setAIPrefill = useUIStore((s) => s.setAIPrefill)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const title = value.trim()
    if (!title) return
    const task = addTask({ title })
    setValue('')
    setAdded(true)
    setAIError(null)
    setTimeout(() => setAdded(false), 1500)
    setSelectedTaskId(task.id)
  }

  async function handleSmartCapture() {
    const input = value.trim()
    if (!input) return
    setAILoading(true)
    setAIError(null)
    try {
      const res = await fetch('/api/ai/smart-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, today: new Date().toISOString().slice(0, 10) }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setAIError('AI failed — creating plain task')
        const task = addTask({ title: input })
        setValue('')
        setSelectedTaskId(task.id)
        return
      }
      // Create task with just the title, then open drawer pre-filled
      const task = addTask({ title: data.title || input })
      setAIPrefill(data)
      setValue('')
      setSelectedTaskId(task.id)
    } catch {
      setAIError('AI failed — creating plain task')
      const task = addTask({ title: input })
      setValue('')
      setSelectedTaskId(task.id)
    } finally {
      setAILoading(false)
    }
  }

  const showSparkle = aiEnabled && value.trim().length > 15

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 pl-14 pr-6 sm:px-6 py-3.5 shrink-0"
        style={{ background: 'var(--color-canvas)', borderBottom: aiError ? undefined : '1px solid var(--color-hairline)' }}
      >
        <span className="text-base select-none" style={{ color: 'var(--color-muted)' }}>+</span>
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setAIError(null) }}
          placeholder="Capture a task…  press / or N to focus"
          className="flex-1 bg-transparent border-none outline-none text-[14px]"
          style={{ color: 'var(--color-ink)', fontFamily: 'inherit' }}
        />
        {showSparkle && (
          <button
            type="button"
            onClick={handleSmartCapture}
            disabled={aiLoading}
            title="Smart capture — let AI fill in the details"
            className="border-none rounded-full px-3 py-1.5 text-[12px] font-medium cursor-pointer transition-all duration-200 disabled:opacity-50"
            style={{ background: 'var(--color-hairline)', color: 'var(--color-ink)' }}
          >
            {aiLoading ? '…' : '✨'}
          </button>
        )}
        <button
          type="submit"
          disabled={!value.trim()}
          className="border-none rounded-full px-4 py-1.5 text-[12px] font-medium cursor-pointer tracking-wide transition-all duration-200 disabled:opacity-30"
          style={{
            background: added ? '#16A34A' : 'var(--color-ink)',
            color: 'var(--color-canvas)',
            minWidth: 56,
          }}
        >
          {added ? '✓ Added' : 'Add'}
        </button>
      </form>
      {aiError && (
        <div
          className="px-6 py-1.5 text-[12px]"
          style={{ background: 'var(--color-canvas)', borderBottom: '1px solid var(--color-hairline)', color: '#EF4444' }}
        >
          {aiError}
        </div>
      )}
    </div>
  )
})

export default QuickCapture
