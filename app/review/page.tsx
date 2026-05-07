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

function isoDate(d: Date) { return d.toISOString().slice(0, 10) }

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
      .filter((t) => { const d = t.completedAt!.slice(0, 10); return d >= prev7Start && d <= prev7End })
      .reduce((acc, t) => acc + t.pomodoroSessions * 25, 0)
    const thisWeekFocusTime = doneTasks
      .filter((t) => t.completedAt!.slice(0, 10) >= last7Start)
      .reduce((acc, t) => acc + t.pomodoroSessions * 25, 0)

    let streak = 0
    for (let i = 0; i < 365; i++) {
      const d = isoDate(addDays(today, -i))
      if (doneTasks.filter((t) => t.completedAt!.slice(0, 10) === d).length === 0) break
      streak++
    }

    const weekData = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(today, i - 6)
      const dateStr = isoDate(d)
      return {
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        count: doneTasks.filter((t) => t.completedAt!.slice(0, 10) === dateStr).length,
      }
    })

    const todaySparkline = weekData.map((d) => ({ v: d.count }))

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
      completedToday, completedThisWeek, completedLastWeek,
      totalFocusTime, thisWeekFocusTime, lastWeekFocusTime,
      streak, weekData, todaySparkline, projectBreakdown,
    }
  }, [tasks, projects])

  const todayTrend = stats.completedThisWeek - stats.completedLastWeek
  const focusTrend = stats.thisWeekFocusTime - stats.lastWeekFocusTime

  return (
    <div className="flex-1 overflow-y-auto px-8 py-7" style={{ background: 'var(--color-canvas)' }}>
      <h1 className="m-0 mb-6 text-[20px] font-semibold" style={{ color: 'var(--color-ink)' }}>
        Weekly Review
      </h1>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3.5 mb-7">
        <StatCard label="Completed Today" value={stats.completedToday} unit="tasks" sparkline={stats.todaySparkline} trend={null} color="#2563EB" />
        <StatCard label="This Week" value={stats.completedThisWeek} unit="tasks" sparkline={stats.todaySparkline} trend={todayTrend} color="#16A34A" />
        <StatCard label="Focus Time" value={Math.round(stats.totalFocusTime / 60 * 10) / 10} unit="hrs total" sparkline={stats.weekData.map((d) => ({ v: d.count }))} trend={focusTrend} color="#D97706" trendUnit="min" />
        <StatCard label="Streak" value={stats.streak} unit={stats.streak === 1 ? 'day' : 'days'} sparkline={stats.todaySparkline} trend={null} color="#7C3AED" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        <ChartCard title="Completions — Last 7 Days">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.weekData} barSize={28}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip
                contentStyle={{ border: '1px solid var(--color-hairline)', borderRadius: 6, fontSize: 12, background: 'var(--color-surface)', color: 'var(--color-ink)' }}
                cursor={{ fill: 'var(--color-stone)' }}
              />
              <Bar dataKey="count" name="Tasks" radius={[4, 4, 0, 0]}>
                {stats.weekData.map((entry, i) => (
                  <Cell key={i} fill={entry.day === new Date().toLocaleDateString('en-US', { weekday: 'short' }) ? '#2563EB' : '#DBEAFE'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="By Project">
          {stats.projectBreakdown.length === 0 ? (
            <p className="text-[13px] my-10 text-center" style={{ color: 'var(--color-muted)' }}>
              No completed tasks yet
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.projectBreakdown} layout="vertical" barSize={16} margin={{ left: 0, right: 16 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-slate)' }} axisLine={false} tickLine={false} width={72} />
                <Tooltip
                  contentStyle={{ border: '1px solid var(--color-hairline)', borderRadius: 6, fontSize: 12, background: 'var(--color-surface)', color: 'var(--color-ink)' }}
                  cursor={{ fill: 'var(--color-stone)' }}
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

function StatCard({
  label, value, unit, sparkline, trend, color, trendUnit,
}: {
  label: string; value: number; unit: string; sparkline: { v: number }[]
  trend: number | null; color: string; trendUnit?: string
}) {
  const trendLabel = trend === null ? null
    : trend > 0 ? `↑ ${trend}${trendUnit ? ' ' + trendUnit : ''}`
    : trend < 0 ? `↓ ${Math.abs(trend)}${trendUnit ? ' ' + trendUnit : ''}`
    : '— same'
  const trendColor = trend === null ? 'var(--color-slate)' : trend > 0 ? '#16A34A' : trend < 0 ? '#DC2626' : 'var(--color-slate)'

  return (
    <div
      className="rounded-[10px] px-4 py-4"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-hairline)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <p className="m-0 mb-2 text-[11px] font-semibold tracking-[0.06em] uppercase" style={{ color: 'var(--color-slate)' }}>
        {label}
      </p>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-[28px] font-bold leading-none" style={{ color }}>{value}</span>
          <span className="text-[12px] ml-1.5" style={{ color: 'var(--color-slate)' }}>{unit}</span>
        </div>
        <div className="w-[60px] h-[32px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkline}>
              <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      {trendLabel && (
        <p className="mt-1.5 mb-0 text-[11px] font-medium" style={{ color: trendColor }}>
          {trendLabel} vs last week
        </p>
      )}
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-[10px] px-5 py-4"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-hairline)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <p className="m-0 mb-3.5 text-[12px] font-semibold tracking-[0.03em]" style={{ color: 'var(--color-ink)' }}>
        {title}
      </p>
      {children}
    </div>
  )
}
