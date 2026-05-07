'use client'

import { type Task } from '@/store/tasks'
import { useProjectStore } from '@/store/projects'

const COLOR_MAP: Record<string, string> = {
  blue: '#3B82F6', rose: '#F43F5E', green: '#22C55E', amber: '#F59E0B',
  purple: '#A855F7', cyan: '#06B6D4', orange: '#F97316', teal: '#14B8A6',
}

export default function MiniCard({ task }: { task: Task }) {
  const projects = useProjectStore((s) => s.projects)
  const project = projects.find((p) => p.id === task.projectId)
  const done = task.status === 'done'

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E8E6E0',
      borderRadius: 7,
      padding: '8px 10px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      display: 'flex',
      alignItems: 'stretch',
      overflow: 'hidden',
    }}>
      <span style={{
        width: 3, flexShrink: 0,
        background: project ? (COLOR_MAP[project.color] ?? '#E5E7EB') : '#E5E7EB',
        borderRadius: '2px 0 0 2px',
        marginRight: 8,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 13, fontWeight: 500,
          color: done ? '#AAAAAA' : '#141414',
          textDecoration: done ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {task.title}
        </p>
        {project && (
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#AAAAAA' }}>{project.title}</p>
        )}
      </div>
    </div>
  )
}
