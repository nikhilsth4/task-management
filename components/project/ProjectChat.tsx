'use client'

import { useState, useEffect, useRef } from 'react'
import { useTaskStore } from '@/store/tasks'
import { useUIStore } from '@/store/ui'
import type { ChatAction } from '@/app/api/ai/project-chat/route'
import ChatMessage, { type Message } from './ChatMessage'
import ChatInput from './ChatInput'

function buildActionLabel(action: ChatAction, taskTitle: string | undefined): string {
  switch (action.type) {
    case 'create_task':
      return `Created "${action.payload.title}"`
    case 'complete_task':
      return `Marked "${taskTitle ?? 'task'}" as done`
    case 'delete_task':
      return `Deleted "${taskTitle ?? 'task'}"`
    case 'update_task': {
      const fields = Object.keys(action.payload.patch).join(', ')
      return `Updated "${taskTitle ?? 'task'}" (${fields})`
    }
  }
}

interface Props {
  projectId: string
  projectTitle: string
}

export default function ProjectChat({ projectId, projectTitle }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const allTasks = useTaskStore((s) => s.tasks)
  const tasks = allTasks.filter((t) => t.projectId === projectId)
  const addTask = useTaskStore((s) => s.addTask)
  const updateTask = useTaskStore((s) => s.updateTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const completeTask = useTaskStore((s) => s.completeTask)
  const aiEnabled = useUIStore((s) => s.aiEnabled)

  useEffect(() => {
    setMessages([])
    setInput('')
  }, [projectId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))

      const taskPayload = tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        urgency: t.urgency,
        importance: t.importance,
        scheduledDate: t.scheduledDate,
      }))

      const res = await fetch('/api/ai/project-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, projectTitle, tasks: taskPayload }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Something went wrong — please try again.', error: true },
        ])
        return
      }

      const actions: ChatAction[] = data.actions ?? []
      const actionResults: { label: string }[] = []

      for (const action of actions) {
        const taskTitle =
          action.type !== 'create_task'
            ? tasks.find((t) => t.id === action.payload.id)?.title
            : undefined
        actionResults.push({ label: buildActionLabel(action, taskTitle) })

        if (action.type === 'create_task') {
          addTask({ ...action.payload, projectId })
        } else if (action.type === 'update_task') {
          updateTask(action.payload.id, action.payload.patch)
        } else if (action.type === 'complete_task') {
          completeTask(action.payload.id)
        } else if (action.type === 'delete_task') {
          deleteTask(action.payload.id)
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.message,
          actionResults: actionResults.length > 0 ? actionResults : undefined,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Connection error — please try again.', error: true },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (!aiEnabled) {
    return (
      <div
        className="shrink-0 px-5 py-4 text-center"
        style={{ borderTop: '1px solid var(--color-hairline)', background: 'var(--color-surface)' }}
      >
        <p className="text-[12px] m-0" style={{ color: 'var(--color-muted)' }}>
          Enable AI in Settings to use chat
        </p>
      </div>
    )
  }

  return (
    <div
      className="shrink-0 flex flex-col"
      style={{
        height: '320px',
        borderTop: '1px solid var(--color-hairline)',
        background: 'var(--color-canvas)',
      }}
    >
      <div className="flex-1 overflow-y-auto py-2">
        {messages.length === 0 && (
          <p className="text-center text-[12px] py-8 m-0" style={{ color: 'var(--color-muted)' }}>
            Tell me what&apos;s happening…
          </p>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        {loading && (
          <div className="flex justify-start px-4 py-1.5">
            <div
              className="px-3 py-2 rounded-2xl rounded-bl-sm text-[16px] tracking-widest"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-hairline)',
                color: 'var(--color-muted)',
              }}
            >
              <span className="inline-flex gap-0.5">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>·</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>·</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>·</span>
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInput value={input} onChange={setInput} onSend={handleSend} disabled={loading} />
    </div>
  )
}
