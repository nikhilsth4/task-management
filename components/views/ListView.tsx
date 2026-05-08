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
  const [search, setSearch] = useState('')

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
    .filter((t) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return t.title.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q) || t.tags.some((tag) => tag.toLowerCase().includes(q))
    })
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
    <div className="px-4 sm:px-6 py-6 flex flex-col gap-4 w-full">
      {/* Toolbar: filters left, search right */}
      <div className="flex items-center gap-2 flex-wrap">
        {showFilters && (
          <>
            {projects.length > 0 && (
              <select value={filterProjectId} onChange={(e) => setFilterProjectId(e.target.value)} style={selectStyle}>
                {[
                  <option key="__all" value="all">All projects</option>,
                  <option key="__inbox" value="">Inbox</option>,
                  ...projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>),
                ]}
              </select>
            )}
            {allTags.length > 0 && (
              <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} style={selectStyle}>
                {[
                  <option key="__all" value="all">All tags</option>,
                  ...allTags.map((tag) => <option key={`tag-${tag}`} value={tag}>{tag}</option>),
                ]}
              </select>
            )}
          </>
        )}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks…"
          className="ml-auto rounded-lg px-3 py-[5px] text-[12px] outline-none w-40 focus:w-56 transition-all duration-200"
          style={{
            background: 'var(--color-stone)',
            border: '1px solid var(--color-hairline)',
            color: 'var(--color-ink)',
          }}
        />
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="pt-20 text-center">
          <p className="text-[14px] m-0" style={{ color: 'var(--color-muted)' }}>
            No tasks yet — capture one above.
          </p>
        </div>
      ) : (
        <ul className="list-none m-0 p-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {filtered.map((task) => (
            <li key={task.id} className="flex">
              <TaskCard task={task} onClick={() => setSelectedTaskId(task.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
