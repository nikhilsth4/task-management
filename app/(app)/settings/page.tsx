'use client'

import { useUIStore } from '@/store/ui'

export default function SettingsPage() {
  const settings = useUIStore((s) => s.settings)
  const pomodoro = useUIStore((s) => s.pomodoro)
  const updateSettings = useUIStore((s) => s.updateSettings)
  const updatePomodoro = useUIStore((s) => s.updatePomodoroSettings)

  return (
    <div className="flex-1 overflow-y-auto px-8 py-7" style={{ background: 'var(--color-canvas)' }}>
      <h1 className="m-0 mb-6 text-[20px] font-semibold" style={{ color: 'var(--color-ink)' }}>
        Settings
      </h1>

      <div className="flex flex-col gap-4 max-w-[480px]">

        <Section title="Timeline">
          <Row label="Start hour">
            <HourSelect
              value={settings.timelineStartHour}
              max={settings.timelineEndHour - 1}
              onChange={(v) => updateSettings({ timelineStartHour: v })}
            />
          </Row>
          <Row label="End hour">
            <HourSelect
              value={settings.timelineEndHour}
              min={settings.timelineStartHour + 1}
              onChange={(v) => updateSettings({ timelineEndHour: v })}
            />
          </Row>
        </Section>

        <Section title="Pomodoro">
          <Row label="Work duration">
            <div className="flex items-center gap-2">
              <NumberInput
                value={pomodoro.workMinutes}
                min={1}
                max={120}
                onChange={(v) => updatePomodoro({ workMinutes: v })}
              />
              <span className="text-[12px]" style={{ color: 'var(--color-slate)' }}>minutes</span>
            </div>
          </Row>
          <Row label="Break duration">
            <div className="flex items-center gap-2">
              <NumberInput
                value={pomodoro.breakMinutes}
                min={1}
                max={60}
                onChange={(v) => updatePomodoro({ breakMinutes: v })}
              />
              <span className="text-[12px]" style={{ color: 'var(--color-slate)' }}>minutes</span>
            </div>
          </Row>
        </Section>

      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-[10px] overflow-hidden"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-hairline)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div
        className="px-4 py-2.5 text-[11px] font-bold tracking-[0.07em] uppercase"
        style={{ borderBottom: '1px solid var(--color-hairline)', color: 'var(--color-muted)' }}
      >
        {title}
      </div>
      <div className="py-1">{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-[13px]" style={{ color: 'var(--color-ink)' }}>{label}</span>
      {children}
    </div>
  )
}

function HourSelect({ value, min = 0, max = 23, onChange }: {
  value: number; min?: number; max?: number; onChange: (v: number) => void
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i).filter((h) => h >= min && h <= max)
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="text-[13px] rounded-md px-2 py-1 cursor-pointer outline-none"
      style={{
        border: '1px solid var(--color-hairline)',
        background: 'var(--color-surface)',
        color: 'var(--color-ink)',
      }}
    >
      {hours.map((h) => (
        <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
      ))}
    </select>
  )
}

function NumberInput({ value, min, max, onChange }: {
  value: number; min: number; max: number; onChange: (v: number) => void
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => {
        const v = Number(e.target.value)
        if (v >= min && v <= max) onChange(v)
      }}
      className="w-[60px] text-[13px] rounded-md px-2 py-1 text-center outline-none"
      style={{
        border: '1px solid var(--color-hairline)',
        background: 'var(--color-surface)',
        color: 'var(--color-ink)',
      }}
    />
  )
}
