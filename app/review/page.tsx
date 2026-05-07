'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell,
} from 'recharts'
import { useTaskStore } from '@/store/tasks'
import { useProjectStore } from '@/store/projects'

const COLOR_MAP: Record<string, string> = {
  blue: '#3B82F6', rose: '#F43F5E', green: '#22C55E', amber: '#F59E0B',
  purple: '#A855F7', cyan: '#06B6D4', orange: '#F97316', teal: '#14B8A6',
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function addDays(date: Date, n: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export default function ReviewPage() {
  const tasks = useTaskStore((s) => s.tasks)
  const projects = useProjectStore((s) => s.projects)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const stats = useMemo(() => {
    const doneTasks = tasks.filter((t) => t.status === 'done' && t.completedAt)

    const todayStr = isoDate(today)
    const completedToday = doneTasks.filter((t) => t.completedAt!.slice(0, 10) === todayStr).length

    const last7Start = isoDate(addDays(today, -6))
    const prev7Start = isoDate(addDays(today, -13))
    const prev7End = isoDate(addDays(today, -7))

    const completedThisWeek = doneTasks.filter((t) => t.completedAt!.slice(0, 10) >= last7Start).length
    const completedLastWeek = doneTasks.filter((t) => {
      const d = t.completedAt!.slice(0, 10)
      return d >= prev7Start && d <= prev7End
    }).length

    const totalFocusTime = tasks.reduce((acc, t) => acc + t.pomodoroSessions * 25, 0)
    const lastWeekFocusTime = doneTasks
      .filter((t) => {
        const d = t.completedAt!.slice(0, 10)
        return d >= prev7Start && d <= prev7End
      })
      .reduce((acc, t) => acc + t.pomodoroSessions * 25, 0)
    const thisWeekFocusTime = doneTasks
      .filter((t) => t.completedAt!.slice(0, 10) >= last7Start)
      .reduce((acc, t) => acc + t.pomodoroSessions * 25, 0)

    // Streak
    let streak = 0
    for (let i = 0; i < 365; i++) {
      const d = isoDate(addDays(today, -i))
      const count = doneTasks.filter((t) => t.completedAt!.slice(0, 10) === d).length
      if (count === 0) break
      streak++
    }

    // 7-day bar data
    const weekData = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(today, i - 6)
      const dateStr = isoDate(d)
      return {
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        count: doneTasks.filter((t) => t.completedAt!.slice(0, 10) === dateStr).length,
      }
    })

    // Sparkline data for stat cards (7 days)
    const todaySparkline = weekData.map((d) => ({ v: d.count }))

    // Project breakdown
    const projectBreakdown = projects.map((p) => {
      const ptasks = doneTasks.filter((t) => t.projectId === p.id)
      return {
        name: p.title,
        count: ptasks.length,
        focus: ptasks.reduce((acc, t) => acc + t.pomodoroSessions * 25, 0),
        color: COLOR_MAP[p.color] ?? '#6B7280',
      }
    }).filter((p) => p.count > 0).sort((a, b) => b.count - a.count)

    const inboxDone = doneTasks.filter((t) => !t.projectId)
    if (inboxDone.length > 0) {
      projectBreakdown.push({
        name: 'Inbox',
        count: inboxDone.length,
        focus: inboxDone.reduce((acc, t) => acc + t.pomodoroSessions * 25, 0),
        color: '#6B7280',
      })
    }

    return {
      completedToday,
      completedThisWeek,
      completedLastWeek,
      totalFocusTime,
      thisWeekFocusTime,
      lastWeekFocusTime,
      streak,
      weekData,
      todaySparkline,
      projectBreakdown,
    }
  }, [tasks, projects])

  const todayTrend = stats.completedThisWeek - stats.completedLastWeek
  const focusTrend = stats.thisWeekFocusTime - stats.lastWeekFocusTime

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: 'var(--color-canvas)' }}>
      <h1 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 600, color: '#141414' }}>
        Weekly Review
      </h1>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        <StatCard
          label="Completed Today"
          value={stats.completedToday}
          unit="tasks"
          sparkline={stats.todaySparkline}
          trend={null}
          color="#2563EB"
        />
        <StatCard
          label="This Week"
          value={stats.completedThisWeek}
          unit="tasks"
          sparkline={stats.todaySparkline}
          trend={todayTrend}
          color="#16A34A"
        />
        <StatCard
          label="Focus Time"
          value={Math.round(stats.totalFocusTime / 60 * 10) / 10}
          unit="hrs total"
          sparkline={stats.weekData.map((d) => ({ v: d.count }))}
          trend={focusTrend}
          color="#D97706"
          trendUnit="min"
        />
        <StatCard
          label="Streak"
          value={stats.streak}
          unit={stats.streak === 1 ? 'day' : 'days'}
          sparkline={stats.todaySparkline}
          trend={null}
          color="#7C3AED"
        />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* 7-day bar chart */}
        <ChartCard title="Completions — Last 7 Days">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.weekData} barSize={28}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#AAAAAA' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#AAAAAA' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip
                contentStyle={{ border: '1px solid #E8E6E0', borderRadius: 6, fontSize: 12 }}
                cursor={{ fill: '#F0EEE8' }}
              />
              <Bar dataKey="count" name="Tasks" radius={[4, 4, 0, 0]}>
                {stats.weekData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.day === new Date().toLocaleDateString('en-US', { weekday: 'short' }) ? '#2563EB' : '#DBEAFE'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Project breakdown */}
        <ChartCard title="By Project">
          {stats.projectBreakdown.length === 0 ? (
            <p style={{ fontSize: 13, color: '#CCCCCC', margin: '40px 0', textAlign: 'center' }}>
              No completed tasks yet
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={stats.projectBreakdown}
                layout="vertical"
                barSize={16}
                margin={{ left: 0, right: 16 }}
              >
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#AAAAAA' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#555' }} axisLine={false} tickLine={false} width={72} />
                <Tooltip
                  contentStyle={{ border: '1px solid #E8E6E0', borderRadius: 6, fontSize: 12 }}
                  cursor={{ fill: '#F0EEE8' }}
                />
                <Bar dataKey="count" name="Tasks" radius={[0, 4, 4, 0]}>
                  {stats.projectBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  )
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({
  label, value, unit, sparkline, trend, color, trendUnit,
}: {
  label: string
  value: number
  unit: string
  sparkline: { v: number }[]
  trend: number | null
  color: string
  trendUnit?: string
}) {
  const trendLabel = trend === null ? null
    : trend > 0 ? `↑ ${trend}${trendUnit ? ' ' + trendUnit : ''}`
    : trend < 0 ? `↓ ${Math.abs(trend)}${trendUnit ? ' ' + trendUnit : ''}`
    : '— same'
  const trendColor = trend === null ? '#AAAAAA' : trend > 0 ? '#16A34A' : trend < 0 ? '#DC2626' : '#AAAAAA'

  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E8E6E0',
      borderRadius: 10, padding: '16px 18px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: '#AAAAAA', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
          <span style={{ fontSize: 12, color: '#AAAAAA', marginLeft: 5 }}>{unit}</span>
        </div>
        <div style={{ width: 60, height: 32 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkline}>
              <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      {trendLabel && (
        <p style={{ margin: '6px 0 0', fontSize: 11, color: trendColor, fontWeight: 500 }}>
          {trendLabel} vs last week
        </p>
      )}
    </div>
  )
}

// ── Chart Card ─────────────────────────────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E8E6E0',
      borderRadius: 10, padding: '18px 20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 600, color: '#555', letterSpacing: '0.03em' }}>
        {title}
      </p>
      {children}
    </div>
  )
}
