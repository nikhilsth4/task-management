'use client'

import { useUIStore } from '@/store/ui'

export default function SettingsPage() {
  const settings = useUIStore((s) => s.settings)
  const pomodoro = useUIStore((s) => s.pomodoro)
  const updateSettings = useUIStore((s) => s.updateSettings)
  const updatePomodoro = useUIStore((s) => s.updatePomodoroSettings)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: '#F7F6F3' }}>
      <h1 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 600, color: '#141414' }}>
        Settings
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>

        {/* Timeline */}
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

        {/* Pomodoro */}
        <Section title="Pomodoro">
          <Row label="Work duration">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <NumberInput
                value={pomodoro.workMinutes}
                min={1}
                max={120}
                onChange={(v) => updatePomodoro({ workMinutes: v })}
              />
              <span style={{ fontSize: 12, color: '#AAAAAA' }}>minutes</span>
            </div>
          </Row>
          <Row label="Break duration">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <NumberInput
                value={pomodoro.breakMinutes}
                min={1}
                max={60}
                onChange={(v) => updatePomodoro({ breakMinutes: v })}
              />
              <span style={{ fontSize: 12, color: '#AAAAAA' }}>minutes</span>
            </div>
          </Row>
        </Section>

      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E8E6E0',
      borderRadius: 10, overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid #F0EEE8',
        fontSize: 11, fontWeight: 700, color: '#AAAAAA',
        letterSpacing: '0.07em', textTransform: 'uppercase',
      }}>
        {title}
      </div>
      <div style={{ padding: '4px 0' }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px',
    }}>
      <span style={{ fontSize: 13, color: '#333' }}>{label}</span>
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
      style={{
        fontSize: 13, color: '#141414',
        border: '1px solid #E8E6E0', borderRadius: 6,
        padding: '4px 8px', background: '#FFFFFF', cursor: 'pointer',
      }}
    >
      {hours.map((h) => (
        <option key={h} value={h}>
          {String(h).padStart(2, '0')}:00
        </option>
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
      style={{
        width: 60, fontSize: 13, color: '#141414',
        border: '1px solid #E8E6E0', borderRadius: 6,
        padding: '4px 8px', background: '#FFFFFF', textAlign: 'center',
      }}
    />
  )
}
