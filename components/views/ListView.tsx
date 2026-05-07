'use client'

import { useState } from 'react' // still used for filterTag
import { useTaskStore, selectActiveTasks } from '@/store/tasks'
import { useProjectStore } from '@/store/projects'
import { useUIStore } from '@/store/ui'
import { getQuadrantPriority } from '@/lib/utils'
import TaskCard from '@/components/task/TaskCard'

export default function ListView() {
  const tasks = selectActiveTasks(useTaskStore((s) => s.tasks))
  const projects = useProjectStore((s) => s.projects)
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId)
  const filterProjectId = useUIStore((s) => s.filterProjectId)
  const setFilterProjectId = useUIStore((s) => s.setFilterProjectId)

  const [filterTag, setFilterTag] = useState<string>('all')

  const allTags = Array.from(new Set(tasks.flatMap((t) => t.tags))).sort()

  const filtered = tasks
    .filter((t) => {
      if (filterProjectId === 'all') return true
      if (filterProjectId === '') return t.projectId === null
      return t.projectId === filterProjectId
    })
    .filter((t) => filterTag === 'all' || t.tags.includes(filterTag))
    .sort((a, b) => getQuadrantPriority(a.urgency, a.importance) - getQuadrantPriority(b.urgency, b.importance))

  const showFilters = projects.length > 0 || allTags.length > 0

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720, width: '100%' }}>
      {/* Filter bar */}
      {showFilters && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {projects.length > 0 && (
            <select
              value={filterProjectId}
              onChange={(e) => setFilterProjectId(e.target.value)}
              style={{
                padding: '6px 10px',
                fontSize: 12,
                border: '1px solid #E8E6E0',
                borderRadius: 6,
                background: '#FFFFFF',
                color: '#555',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All projects</option>
              <option value="">Inbox</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          )}
          {allTags.length > 0 && (
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              style={{
                padding: '6px 10px',
                fontSize: 12,
                border: '1px solid #E8E6E0',
                borderRadius: 6,
                background: '#FFFFFF',
                color: '#555',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
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
        <div style={{ paddingTop: 80, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#BBBBBB', margin: 0 }}>No tasks yet — capture one above.</p>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
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
