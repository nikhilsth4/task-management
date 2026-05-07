'use client'

import { forwardRef, useState } from 'react'
import { useTaskStore } from '@/store/tasks'

const QuickCapture = forwardRef<HTMLInputElement>(function QuickCapture(_, ref) {
  const [value, setValue] = useState('')
  const addTask = useTaskStore((s) => s.addTask)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const title = value.trim()
    if (!title) return
    addTask({ title })
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 24px',
      background: '#FFFFFF',
      borderBottom: '1px solid #E8E6E0',
    }}>
      <span style={{ color: '#BBBBBB', fontSize: 16, userSelect: 'none' }}>+</span>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Capture a task…  press / or N to focus"
        style={{
          flex: 1,
          background: 'none',
          border: 'none',
          outline: 'none',
          fontSize: 14,
          color: '#141414',
          fontFamily: 'var(--font-geist-sans)',
        }}
      />
      {value.trim() && (
        <button
          type="submit"
          style={{
            background: '#141414',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 6,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            letterSpacing: '0.02em',
          }}
        >
          Add
        </button>
      )}
    </form>
  )
})

export default QuickCapture
