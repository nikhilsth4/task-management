'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useTaskStore } from '@/store/tasks'
import { useProjectStore } from '@/store/projects'
import { useUIStore } from '@/store/ui'
import { isoToday } from '@/lib/utils'
import TaskDetail from '@/components/task/TaskDetail'

const COLOR_MAP: Record<string, string> = {
  blue: '#3B82F6', rose: '#F43F5E', green: '#22C55E', amber: '#F59E0B',
  purple: '#A855F7', cyan: '#06B6D4', orange: '#F97316', teal: '#14B8A6',
}

const STATUS_LABEL: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

const STATUS_COLOR: Record<string, string> = {
  todo: 'var(--color-muted)',
  in_progress: '#D97706',
  done: '#16A34A',
}

function formatDate(dateStr: string, today: string) {
  const tomorrow = new Date(today + 'T12:00:00')
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(today + 'T12:00:00')
  yesterday.setDate(yesterday.getDate() - 1)

  if (dateStr === today) return 'Today'
  if (dateStr === tomorrow.toISOString().slice(0, 10)) return 'Tomorrow'
  if (dateStr === yesterday.toISOString().slice(0, 10)) return 'Yesterday'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

export default function HistoryPage() {
  const tasks = useTaskStore((s) => s.tasks)
  const projects = useProjectStore((s) => s.projects)
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId)
  const [search, setSearch] = useState('')

  const today = isoToday()

  const grouped = useMemo(() => {
    const q = search.toLowerCase().trim()
    const filtered = tasks.filter((t) => {
      if (!q) return true
      return (
        t.title.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    })

    const withDate = filtered.filter((t) => t.scheduledDate)
    const unscheduled = filtered.filter((t) => !t.scheduledDate)

    const map = new Map<string, typeof filtered>()
    for (const task of withDate) {
      const date = task.scheduledDate!
      if (!map.has(date)) map.set(date, [])
      map.get(date)!.push(task)
    }

    const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
    return { sorted, unscheduled }
  }, [tasks, search])

  const selectedTaskId = useUIStore((s) => s.selectedTaskId)

  return (
    <>
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-7" style={{ background: 'var(--color-canvas)' }}>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="m-0 text-[20px] font-semibold" style={{ color: 'var(--color-ink)' }}>All Tasks</h1>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks…"
          className="rounded-lg px-3 py-2 text-[13px] outline-none w-48 focus:w-64 transition-all duration-200"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-hairline)', color: 'var(--color-ink)' }}
        />
      </div>

      {grouped.sorted.length === 0 && grouped.unscheduled.length === 0 ? (
        <p className="text-[13px]" style={{ color: 'var(--color-muted)' }}>No tasks found.</p>
      ) : (
        <>
          {grouped.sorted.map(([date, dateTasks]) => (
            <div key={date} className="mb-7">
              <div className="flex items-center gap-2.5 mb-2.5">
                <span
                  className="text-[11px] font-bold tracking-[0.06em] uppercase"
                  style={{ color: date === today ? 'var(--color-blue-action)' : 'var(--color-muted)' }}
                >
                  {formatDate(date, today)}
                </span>
                <span className="text-[11px] font-medium px-1.5 py-px rounded-[10px]" style={{ color: 'var(--color-muted)', background: 'var(--color-stone)' }}>
                  {dateTasks.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {dateTasks.map((task) => (
                  <TaskRow key={task.id} task={task} projects={projects} onClick={() => setSelectedTaskId(task.id)} />
                ))}
              </div>
            </div>
          ))}

          {grouped.unscheduled.length > 0 && (
            <div className="mb-7">
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className="text-[11px] font-bold tracking-[0.06em] uppercase" style={{ color: 'var(--color-muted)' }}>Unscheduled</span>
                <span className="text-[11px] font-medium px-1.5 py-px rounded-[10px]" style={{ color: 'var(--color-muted)', background: 'var(--color-stone)' }}>
                  {grouped.unscheduled.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {grouped.unscheduled.map((task) => (
                  <TaskRow key={task.id} task={task} projects={projects} onClick={() => setSelectedTaskId(task.id)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
    <AnimatePresence>{selectedTaskId && <TaskDetail />}</AnimatePresence>
    </>
  )
}

type Task = ReturnType<typeof useTaskStore.getState>['tasks'][0]
type Projects = ReturnType<typeof useProjectStore.getState>['projects']

function TaskRow({ task, projects, onClick }: { task: Task; projects: Projects; onClick: () => void }) {
  const project = projects.find((p) => p.id === task.projectId)
  const accent = project ? (COLOR_MAP[project.color] ?? 'var(--color-hairline)') : 'var(--color-hairline)'

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick() }}
      className="flex items-stretch rounded-lg overflow-hidden cursor-pointer transition-shadow duration-150 hover:shadow-md"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-hairline)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <span className="w-[3px] shrink-0" style={{ background: accent }} />
      <div className="px-3.5 py-2.5 flex-1 min-w-0">
        <p
          className="m-0 text-[13px] font-medium overflow-hidden text-ellipsis whitespace-nowrap"
          style={{
            color: 'var(--color-ink)',
            textDecoration: task.status === 'done' ? 'line-through' : 'none',
            opacity: task.status === 'done' ? 0.5 : 1,
          }}
        >
          {task.title}
        </p>
        <div className="flex gap-2 mt-0.5">
          {project && <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>{project.title}</span>}
          {task.scheduledTime && <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>{task.scheduledTime}</span>}
        </div>
      </div>
      <div className="self-center pr-3.5 shrink-0">
        <span className="text-[11px] font-medium" style={{ color: STATUS_COLOR[task.status] }}>
          {STATUS_LABEL[task.status]}
        </span>
      </div>
    </div>
  )
}
