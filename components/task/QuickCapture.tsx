'use client'

import { forwardRef, useState } from 'react'
import { useTaskStore } from '@/store/tasks'
import { useUIStore } from '@/store/ui'

const QuickCapture = forwardRef<HTMLInputElement>(function QuickCapture(_, ref) {
  const [value, setValue] = useState('')
  const [added, setAdded] = useState(false)
  const addTask = useTaskStore((s) => s.addTask)
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const title = value.trim()
    if (!title) return
    const task = addTask({ title })
    setValue('')
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
    setSelectedTaskId(task.id)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 pl-14 pr-6 sm:px-6 py-3.5 shrink-0"
      style={{ background: 'var(--color-canvas)', borderBottom: '1px solid var(--color-hairline)' }}
    >
      <span className="text-base select-none" style={{ color: 'var(--color-muted)' }}>+</span>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Capture a task…  press / or N to focus"
        className="flex-1 bg-transparent border-none outline-none text-[14px]"
        style={{ color: 'var(--color-ink)', fontFamily: 'inherit' }}
      />
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
  )
})

export default QuickCapture
