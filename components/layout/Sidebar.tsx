'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutList, BarChart2, Settings, Plus, Check, X } from 'lucide-react'
import { useProjectStore } from '@/store/projects'
import { useTaskStore } from '@/store/tasks'
import { useUIStore } from '@/store/ui'
import { PROJECT_COLORS } from '@/lib/constants'

const NAV = [
  { label: 'Today', href: '/', Icon: LayoutList },
  { label: 'Review', href: '/review', Icon: BarChart2 },
  { label: 'Settings', href: '/settings', Icon: Settings },
]

const COLOR_MAP: Record<string, string> = {
  blue: '#3B82F6', rose: '#F43F5E', green: '#22C55E', amber: '#F59E0B',
  purple: '#A855F7', cyan: '#06B6D4', orange: '#F97316', teal: '#14B8A6',
}

export default function Sidebar() {
  const pathname = usePathname()
  const projects = useProjectStore((s) => s.projects)
  const addProject = useProjectStore((s) => s.addProject)
  const deleteProject = useProjectStore((s) => s.deleteProject)
  const deleteTasksByProject = useTaskStore((s) => s.deleteTasksByProject)
  const filterProjectId = useUIStore((s) => s.filterProjectId)
  const setFilterProjectId = useUIStore((s) => s.setFilterProjectId)

  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newColor, setNewColor] = useState('blue')

  function handleAddProject(e: React.FormEvent) {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title) return
    addProject({ title, color: newColor })
    setNewTitle('')
    setNewColor('blue')
    setShowForm(false)
  }

  return (
    <aside style={{
      width: 200,
      flexShrink: 0,
      background: '#141414',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      padding: '24px 0',
      height: '100%',
    }}>
      {/* App name */}
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #2A2A2A' }}>
        <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Focus
        </span>
      </div>

      {/* Nav */}
      <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ label, href, Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 6,
                textDecoration: 'none',
                background: active ? '#2A2A2A' : 'transparent',
                color: active ? '#FFFFFF' : '#888888',
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <Icon size={14} strokeWidth={active ? 2 : 1.5} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Projects */}
      <div style={{ padding: '0 12px', marginTop: 8, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', marginBottom: 8 }}>
          <p style={{ color: '#444', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
            Projects
          </p>
          <button
            onClick={() => setShowForm((v) => !v)}
            title="New project"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 2, display: 'flex' }}
          >
            <Plus size={13} />
          </button>
        </div>

        {/* Inline new project form */}
        {showForm && (
          <form onSubmit={handleAddProject} style={{ padding: '0 4px', marginBottom: 8 }}>
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Project name"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#1E1E1E', border: '1px solid #333',
                borderRadius: 5, padding: '5px 8px',
                fontSize: 12, color: '#FFFFFF', outline: 'none',
                marginBottom: 6, fontFamily: 'inherit',
              }}
            />
            {/* Color picker */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  title={c}
                  style={{
                    width: 16, height: 16, borderRadius: '50%',
                    background: COLOR_MAP[c] ?? '#888',
                    border: newColor === c ? '2px solid #FFFFFF' : '2px solid transparent',
                    cursor: 'pointer', padding: 0, flexShrink: 0,
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="submit"
                style={{
                  flex: 1, background: '#2A2A2A', border: '1px solid #333',
                  color: '#FFFFFF', borderRadius: 5, padding: '5px 0',
                  fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}
              >
                <Check size={11} /> Add
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setNewTitle(''); setNewColor('blue') }}
                style={{
                  background: 'none', border: '1px solid #333',
                  color: '#666', borderRadius: 5, padding: '5px 10px',
                  fontSize: 11, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* All Projects */}
        <FilterItem
          label="All Projects"
          active={filterProjectId === 'all'}
          onClick={() => setFilterProjectId('all')}
          dot={null}
        />
        {/* Inbox */}
        <FilterItem
          label="Inbox"
          active={filterProjectId === ''}
          onClick={() => setFilterProjectId(filterProjectId === '' ? 'all' : '')}
          dot="#6B7280"
        />

        {projects.map((p) => (
          <ProjectItem
            key={p.id}
            label={p.title}
            active={filterProjectId === p.id}
            dot={COLOR_MAP[p.color] ?? '#888'}
            onClick={() => setFilterProjectId(filterProjectId === p.id ? 'all' : p.id)}
            onDelete={() => {
              deleteTasksByProject(p.id)
              deleteProject(p.id)
              if (filterProjectId === p.id) setFilterProjectId('all')
            }}
          />
        ))}
      </div>
    </aside>
  )
}

function ProjectItem({
  label, active, dot, onClick, onDelete,
}: {
  label: string
  active: boolean
  dot: string
  onClick: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center',
        borderRadius: 6,
        background: active ? '#2A2A2A' : 'transparent',
      }}
    >
      <button
        onClick={onClick}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 10px', borderRadius: 6,
          background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
          minWidth: 0,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flexShrink: 0 }} />
        <span style={{ color: active ? '#FFFFFF' : '#888', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </span>
      </button>
      {hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          title="Delete project"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px 8px 4px 2px', color: active ? '#888' : '#666',
            display: 'flex', alignItems: 'center', flexShrink: 0,
          }}
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}

function FilterItem({
  label, active, onClick, dot,
}: {
  label: string
  active: boolean
  onClick: () => void
  dot: string | null
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 10px', borderRadius: 6,
        background: active ? '#2A2A2A' : 'transparent',
        border: 'none', cursor: 'pointer', textAlign: 'left',
      }}
    >
      {dot !== null
        ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flexShrink: 0 }} />
        : <span style={{ width: 6, flexShrink: 0 }} />
      }
      <span style={{ color: active ? '#FFFFFF' : '#888', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </button>
  )
}
