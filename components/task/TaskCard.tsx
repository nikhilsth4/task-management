'use client'

import { type Task } from '@/store/tasks'
import { useProjectStore } from '@/store/projects'
import { getQuadrant } from '@/lib/utils'

interface TaskCardProps {
  task: Task
  onClick: () => void
}

const QUADRANT_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  urgent_important:       { bg: '#FEE2E2', color: '#DC2626', label: 'Q1 · Urgent' },
  not_urgent_important:   { bg: '#DBEAFE', color: '#2563EB', label: 'Q2 · Important' },
  urgent_not_important:   { bg: '#FEF3C7', color: '#D97706', label: 'Q3 · Urgent' },
  not_urgent_not_important: { bg: '#F3F4F6', color: '#6B7280', label: 'Q4' },
}

const COLOR_MAP: Record<string, string> = {
  blue: '#3B82F6', rose: '#F43F5E', green: '#22C55E', amber: '#F59E0B',
  purple: '#A855F7', cyan: '#06B6D4', orange: '#F97316', teal: '#14B8A6',
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const projects = useProjectStore((s) => s.projects)
  const project = projects.find((p) => p.id === task.projectId)
  const quadrant = getQuadrant(task.urgency, task.importance)
  const q = QUADRANT_STYLE[quadrant]
  const done = task.status === 'done'

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'stretch',
        gap: 0,
        background: '#FFFFFF',
        border: '1px solid #E8E6E0',
        borderRadius: 8,
        cursor: 'pointer',
        textAlign: 'left',
        padding: 0,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
        e.currentTarget.style.borderColor = '#D0CEC8'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
        e.currentTarget.style.borderColor = '#E8E6E0'
      }}
    >
      {/* Project color strip */}
      <span style={{
        width: 3,
        flexShrink: 0,
        background: project ? (COLOR_MAP[project.color] ?? '#E5E7EB') : '#E5E7EB',
        borderRadius: '0',
      }} />

      <div style={{ flex: 1, padding: '12px 14px' }}>
        <p style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 500,
          color: done ? '#AAAAAA' : '#141414',
          textDecoration: done ? 'line-through' : 'none',
          lineHeight: 1.4,
        }}>
          {task.title}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 7px',
            borderRadius: 4,
            background: q.bg,
            color: q.color,
            letterSpacing: '0.02em',
          }}>
            {q.label}
          </span>
          <span style={{ fontSize: 12, color: '#AAAAAA' }}>
            {project ? project.title : 'Inbox'}
          </span>
        </div>
      </div>
    </button>
  )
}
