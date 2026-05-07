'use client'

import { useState } from 'react'
import { useTaskStore } from '@/store/tasks'
import { useProjectStore } from '@/store/projects'
import { useUIStore } from '@/store/ui'
import { getQuadrantPriority, isoToday } from '@/lib/utils'
import TaskCard from '@/components/task/TaskCard'

export default function ListView() {
  const tasks = useTaskStore((s) => s.tasks)
  const projects = useProjectStore((s) => s.projects)
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId)
  const filterProjectId = useUIStore((s) => s.filterProjectId)
  const setFilterProjectId = useUIStore((s) => s.setFilterProjectId)

  const [filterTag, setFilterTag] = useState<string>('all')

  const allTags = Array.from(new Set(tasks.flatMap((t) => t.tags))).sort()

  const today = isoToday()
  const filtered = tasks
    .filter((t) => t.scheduledDate === null || t.scheduledDate === today)
    .filter((t) => {
      if (filterProjectId === 'all') return true
      if (filterProjectId === '') return t.projectId === null
      return t.projectId === filterProjectId
    })
    .filter((t) => filterTag === 'all' || t.tags.includes(filterTag))
    .sort((a, b) => getQuadrantPriority(a.urgency, a.importance) - getQuadrantPriority(b.urgency, b.importance))

  const showFilters = projects.length > 0 || allTags.length > 0

  const selectStyle: React.CSSProperties = {
    padding: '5px 10px',
    fontSize: 12,
    border: '1px solid var(--color-hairline)',
    borderRadius: 6,
    background: 'var(--color-stone)',
    color: 'var(--color-ink)',
    outline: 'none',
    cursor: 'pointer',
  }

  return (
    <div className="px-6 py-6 flex flex-col gap-4 max-w-2xl w-full">
      {/* Filter bar */}
      {showFilters && (
        <div className="flex gap-2 flex-wrap">
          {projects.length > 0 && (
            <select value={filterProjectId} onChange={(e) => setFilterProjectId(e.target.value)} style={selectStyle}>
              <option value="all">All projects</option>
              <option value="">Inbox</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          )}
          {allTags.length > 0 && (
            <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} style={selectStyle}>
              <option value="all">All tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="pt-20 text-center">
          <p className="text-[14px] m-0" style={{ color: 'var(--color-muted)' }}>
            No tasks yet — capture one above.
          </p>
        </div>
      ) : (
        <ul className="list-none m-0 p-0 flex flex-col gap-2">
          {filtered.map((task) => (
            <li key={task.id}>
              <TaskCard task={task} onClick={() => setSelectedTaskId(task.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
