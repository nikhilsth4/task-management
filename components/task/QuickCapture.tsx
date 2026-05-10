'use client'

import { forwardRef, useState, useMemo } from 'react'
import { useTaskStore } from '@/store/tasks'
import { useUIStore } from '@/store/ui'
import { useProjectStore } from '@/store/projects'
import { parseQuickCapture } from '@/lib/quickparse'

const COLOR_MAP: Record<string, string> = {
  blue: '#3B82F6', rose: '#F43F5E', green: '#22C55E', amber: '#F59E0B',
  purple: '#A855F7', cyan: '#06B6D4', orange: '#F97316', teal: '#14B8A6',
}

const QuickCapture = forwardRef<HTMLInputElement>(function QuickCapture(_, ref) {
  const [value, setValue] = useState('')
  const [added, setAdded] = useState(false)
  const [aiLoading, setAILoading] = useState(false)
  const [aiError, setAIError] = useState<string | null>(null)

  const addTask = useTaskStore((s) => s.addTask)
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId)
  const aiEnabled = useUIStore((s) => s.aiEnabled)
  const setAIPrefill = useUIStore((s) => s.setAIPrefill)
  const projects = useProjectStore((s) => s.projects)

  const parsed = useMemo(() => parseQuickCapture(value, projects), [value, projects])
  const hasChips =
    parsed.chips.project ||
    parsed.chips.date ||
    parsed.chips.time ||
    parsed.chips.urgent ||
    parsed.chips.important

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const title = parsed.title
    if (!title) return
    const task = addTask({
      title,
      projectId: parsed.projectId,
      scheduledDate: parsed.scheduledDate,
      scheduledTime: parsed.scheduledTime,
      urgency: parsed.urgency,
      importance: parsed.importance,
    })
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
        style={{ background: 'var(--color-canvas)', borderBottom: aiError || hasChips ? undefined : '1px solid var(--color-hairline)' }}
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
          disabled={!parsed.title}
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

      {hasChips && (
        <div
          className="flex items-center gap-1.5 flex-wrap pl-14 pr-6 sm:px-6 py-1.5"
          style={{ background: 'var(--color-canvas)', borderBottom: aiError ? undefined : '1px solid var(--color-hairline)' }}
        >
          {parsed.chips.project && (
            <Chip
              label={parsed.chips.project.title}
              dot={COLOR_MAP[parsed.chips.project.color] ?? '#888'}
            />
          )}
          {parsed.chips.date && <Chip label={parsed.chips.date.label} variant="surface" />}
          {parsed.chips.time && <Chip label={parsed.chips.time.label} variant="surface" />}
          {parsed.chips.urgent && (
            <Chip label="Urgent" variant="urgent" />
          )}
          {parsed.chips.important && (
            <Chip label="Important" variant="important" />
          )}
        </div>
      )}

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

interface ChipProps {
  label: string
  dot?: string
  variant?: 'surface' | 'urgent' | 'important'
}

function Chip({ label, dot, variant = 'surface' }: ChipProps) {
  const styles = {
    surface: { background: 'var(--color-stone)', color: 'var(--color-slate)', border: '1px solid var(--color-hairline)' },
    urgent: { background: 'var(--badge-q1-bg)', color: 'var(--badge-q1-text)', border: '1px solid transparent' },
    important: { background: 'var(--badge-q2-bg)', color: 'var(--color-blue-action)', border: '1px solid transparent' },
  }[variant]

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={styles}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} />}
      {label}
    </span>
  )
}

export default QuickCapture
