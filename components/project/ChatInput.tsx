'use client'

import { useRef, useEffect } from 'react'
import { Send } from 'lucide-react'

interface Props {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  disabled: boolean
}

export default function ChatInput({ value, onChange, onSend, disabled }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.style.height = 'auto'
    ref.current.style.height = Math.min(ref.current.scrollHeight, 96) + 'px'
  }, [value])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!disabled && value.trim()) onSend()
    }
  }

  return (
    <div
      className="flex items-end gap-2 px-4 py-3 shrink-0"
      style={{ borderTop: '1px solid var(--color-hairline)', background: 'var(--color-canvas)' }}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="What's happening with this project?"
        rows={1}
        className="flex-1 resize-none rounded-lg px-3 py-2 text-[13px] outline-none"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-hairline)',
          color: 'var(--color-ink)',
          fontFamily: 'inherit',
          lineHeight: '1.5',
          maxHeight: '96px',
          overflow: 'auto',
        }}
      />
      <button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border-none cursor-pointer transition-all disabled:opacity-40"
        style={{ background: 'var(--color-ink)', color: 'var(--color-canvas)' }}
      >
        <Send size={13} />
      </button>
    </div>
  )
}
