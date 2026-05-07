'use client'

import { Timer } from 'lucide-react'
import { type Task } from '@/store/tasks'
import { useProjectStore } from '@/store/projects'
import { useUIStore } from '@/store/ui'
import { getQuadrant, formatTimeRange } from '@/lib/utils'

interface TaskCardProps {
  task: Task
  onClick: () => void
}

const QUADRANT_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  urgent_important:           { bg: 'var(--badge-q1-bg)', color: 'var(--badge-q1-text)', label: 'Q1 · Urgent'     },
  not_urgent_important:       { bg: 'var(--badge-q2-bg)', color: 'var(--badge-q2-text)', label: 'Q2 · Important'  },
  urgent_not_important:       { bg: 'var(--badge-q3-bg)', color: 'var(--badge-q3-text)', label: 'Q3 · Delegate'   },
  not_urgent_not_important:   { bg: 'var(--badge-q4-bg)', color: 'var(--badge-q4-text)', label: 'Q4'              },
}

const COLOR_MAP: Record<string, string> = {
  blue: '#3B82F6', rose: '#F43F5E', green: '#22C55E', amber: '#F59E0B',
  purple: '#A855F7', cyan: '#06B6D4', orange: '#F97316', teal: '#14B8A6',
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const projects = useProjectStore((s) => s.projects)
  const startPomodoro = useUIStore((s) => s.startPomodoro)
  const project = projects.find((p) => p.id === task.projectId)
  const quadrant = getQuadrant(task.urgency, task.importance)
  const badge = QUADRANT_BADGE[quadrant]
  const done = task.status === 'done'

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      className="group w-full flex items-stretch rounded-lg overflow-hidden cursor-pointer text-left transition-all duration-150"
      style={{
        background: 'var(--color-stone)',
        border: '1px solid var(--color-hairline)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.10)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'
      }}
    >
      {/* Project color strip */}
      <span
        className="w-[3px] shrink-0"
        style={{ background: project ? (COLOR_MAP[project.color] ?? 'var(--color-hairline)') : 'var(--color-hairline)' }}
      />

      <div className="flex-1 px-4 py-3 min-w-0">
        <p
          className="m-0 text-[14px] font-medium leading-snug"
          style={{
            color: done ? 'var(--color-slate)' : 'var(--color-ink)',
            textDecoration: done ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </p>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span
            className="text-[11px] font-semibold px-1.5 py-0.5 rounded"
            style={{ background: badge.bg, color: badge.color }}
          >
            {badge.label}
          </span>
          <span className="text-[12px]" style={{ color: 'var(--color-slate)' }}>
            {project ? project.title : 'Inbox'}
          </span>
          {task.scheduledTime && (
            <span className="text-[12px] ml-auto" style={{ color: 'var(--color-slate)' }}>
              {formatTimeRange(task.scheduledTime, task.duration)}
            </span>
          )}
        </div>
      </div>

      {/* Focus button — revealed on hover */}
      <button
        data-focus-btn
        onClick={(e) => { e.stopPropagation(); startPomodoro(task.id) }}
        title="Start focus session"
        className="opacity-0 group-hover:opacity-100 self-center mr-3 border rounded-md p-1.5 cursor-pointer flex items-center transition-opacity duration-150"
        style={{
          background: 'transparent',
          borderColor: 'var(--color-hairline)',
          color: 'var(--color-slate)',
        }}
      >
        <Timer size={13} />
      </button>
    </div>
  )
}
