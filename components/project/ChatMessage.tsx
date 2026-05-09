export interface ActionResult {
  label: string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
  actionResults?: ActionResult[]
  error?: boolean
}

export default function ChatMessage({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end px-4 py-1.5">
        <div
          className="max-w-[75%] px-3 py-2 rounded-2xl rounded-br-sm text-[13px] leading-relaxed"
          style={{ background: 'var(--color-blue-action)', color: '#ffffff' }}
        >
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start px-4 py-1.5">
      <div className="max-w-[85%] flex flex-col gap-1.5">
        <div
          className="px-3 py-2 rounded-2xl rounded-bl-sm text-[13px] leading-relaxed"
          style={{
            background: message.error ? '#fee2e2' : 'var(--color-surface)',
            color: message.error ? '#dc2626' : 'var(--color-ink)',
            border: '1px solid var(--color-hairline)',
          }}
        >
          {message.content}
        </div>
        {message.actionResults && message.actionResults.length > 0 && (
          <div className="flex flex-col gap-0.5 px-1">
            {message.actionResults.map((r, i) => (
              <p
                key={i}
                className="text-[11px] m-0 flex items-center gap-1.5"
                style={{ color: 'var(--color-slate)' }}
              >
                <span style={{ color: '#22c55e', fontWeight: 600 }}>✓</span>
                {r.label}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
