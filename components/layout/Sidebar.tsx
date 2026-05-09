'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutList, BarChart2, Settings, Plus, Check, X, CheckCheck, Sun, Moon, Monitor, LogOut, ArrowRight } from 'lucide-react'
import { useProjectStore } from '@/store/projects'
import { useTaskStore } from '@/store/tasks'
import { useUIStore, type Theme } from '@/store/ui'
import { PROJECT_COLORS } from '@/lib/constants'
import { applyTheme } from './ThemeSync'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { label: 'Today',     href: '/',        Icon: LayoutList },
  { label: 'All Tasks', href: '/history',  Icon: CheckCheck },
  { label: 'Review',    href: '/review',   Icon: BarChart2 },
  { label: 'Settings',  href: '/settings', Icon: Settings },
]

const COLOR_MAP: Record<string, string> = {
  blue: '#3B82F6', rose: '#F43F5E', green: '#22C55E', amber: '#F59E0B',
  purple: '#A855F7', cyan: '#06B6D4', orange: '#F97316', teal: '#14B8A6',
}

const THEME_CYCLES: { value: Theme; Icon: React.ElementType; label: string }[] = [
  { value: 'light',  Icon: Sun,     label: 'Light'  },
  { value: 'system', Icon: Monitor, label: 'System' },
  { value: 'dark',   Icon: Moon,    label: 'Dark'   },
]

export default function Sidebar() {
  const pathname = usePathname()
  const projects = useProjectStore((s) => s.projects)
  const addProject = useProjectStore((s) => s.addProject)
  const deleteProject = useProjectStore((s) => s.deleteProject)
  const deleteTasksByProject = useTaskStore((s) => s.deleteTasksByProject)
  const filterProjectId = useUIStore((s) => s.filterProjectId)
  const setFilterProjectId = useUIStore((s) => s.setFilterProjectId)
  const theme = useUIStore((s) => s.theme)
  const updateTheme = useUIStore((s) => s.updateTheme)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)
  const realtimeConnected = useUIStore((s) => s.realtimeConnected)

  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newColor, setNewColor] = useState('blue')

  // Close sidebar overlay when navigating
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

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
    <>
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={[
          // Layout: fixed overlay on mobile, static in flow on sm+
          'fixed inset-y-0 left-0 z-50 flex flex-col h-full shrink-0',
          'sm:static sm:inset-auto sm:z-auto sm:h-full',
          // Width: full sidebar on mobile overlay & desktop, icon strip on tablet
          'w-[220px] sm:w-12 lg:w-[200px]',
          // Slide animation on mobile only
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'sm:translate-x-0 transition-transform duration-250',
        ].join(' ')}
        style={{ background: 'var(--color-sidebar)' }}
      >
        {/* Wordmark — hidden on tablet icon strip */}
        <div className="px-5 py-6 sm:hidden lg:block" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="text-[13px] font-semibold tracking-widest uppercase" style={{ color: '#ffffff', fontFamily: 'var(--font-display)' }}>
            Focus
          </span>
        </div>

        {/* Tablet top padding */}
        <div className="hidden sm:block lg:hidden py-4" />

        {/* Nav */}
        <nav className="px-3 py-4 flex flex-col gap-0.5 sm:px-1 lg:px-3">
          {NAV.map(({ label, href, Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] no-underline transition-colors sm:justify-center sm:px-0 lg:justify-start lg:px-2.5"
                style={{
                  background: active ? 'var(--color-sidebar-active)' : 'transparent',
                  color: active ? '#ffffff' : 'var(--color-sidebar-text)',
                  fontWeight: active ? 500 : 400,
                }}
              >
                <Icon size={14} strokeWidth={active ? 2 : 1.5} />
                <span className="sm:hidden lg:inline">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Projects — hidden on tablet icon strip */}
        <div className="flex sm:hidden lg:flex px-3 mt-2 flex-1 flex-col min-h-0">
          <div className="flex items-center justify-between px-2.5 mb-2">
            <p className="text-[10px] font-semibold tracking-widest uppercase m-0" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Projects
            </p>
            <button
              onClick={() => setShowForm((v) => !v)}
              title="New project"
              className="border-none cursor-pointer p-0.5 flex transition-colors"
              style={{ background: 'transparent', color: 'rgba(255,255,255,0.3)' }}
            >
              <Plus size={13} />
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleAddProject} className="px-1 mb-2">
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Project name"
                className="w-full rounded-md px-2 py-1.5 text-[12px] outline-none mb-1.5"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  fontFamily: 'inherit',
                }}
              />
              <div className="flex gap-1 flex-wrap mb-2">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    title={c}
                    className="w-4 h-4 rounded-full cursor-pointer p-0 shrink-0 border-2 transition-all"
                    style={{
                      background: COLOR_MAP[c] ?? '#888',
                      borderColor: newColor === c ? '#ffffff' : 'transparent',
                    }}
                  />
                ))}
              </div>
              <div className="flex gap-1.5">
                <button
                  type="submit"
                  className="flex-1 rounded-md py-1 text-[11px] cursor-pointer flex items-center justify-center gap-1 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }}
                >
                  <Check size={11} /> Add
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setNewTitle(''); setNewColor('blue') }}
                  className="rounded-md px-2.5 py-1 text-[11px] cursor-pointer transition-colors"
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="flex-1 overflow-y-auto min-h-0">
            <FilterItem label="All Projects" active={filterProjectId === 'all'} onClick={() => setFilterProjectId('all')} dot={null} />
            <FilterItem label="Inbox" active={filterProjectId === ''} onClick={() => setFilterProjectId(filterProjectId === '' ? 'all' : '')} dot="#6B7280" />
            {projects.map((p) => (
              <ProjectItem
                key={p.id}
                id={p.id}
                label={p.title}
                dot={COLOR_MAP[p.color] ?? '#888'}
                onDelete={() => {
                  deleteTasksByProject(p.id)
                  deleteProject(p.id)
                  if (filterProjectId === p.id) setFilterProjectId('all')
                }}
              />
            ))}
          </div>
        </div>

        {/* Sign out + connection indicator */}
        <div className="px-3 pt-2 sm:flex sm:justify-center lg:block lg:px-3">
          <button
            onClick={async () => {
              const supabase = createClient()
              await supabase.auth.signOut()
              window.location.href = '/login'
            }}
            title="Sign out"
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] border-none cursor-pointer transition-colors sm:w-auto sm:justify-center sm:px-2 lg:w-full lg:justify-start lg:px-2.5"
            style={{ background: 'transparent', color: 'var(--color-sidebar-text)' }}
          >
            <LogOut size={14} strokeWidth={1.5} />
            <span className="sm:hidden lg:inline">Sign out</span>
          </button>
          <div
            className="sm:hidden lg:flex items-center gap-1.5 px-2.5 pb-2"
            title={realtimeConnected ? 'Live sync active' : 'Connecting…'}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-500"
              style={{ background: realtimeConnected ? '#22C55E' : 'rgba(255,255,255,0.2)' }}
            />
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {realtimeConnected ? 'Live' : 'Connecting…'}
            </span>
          </div>
        </div>

        {/* Theme toggle — hidden on tablet icon strip */}
        <div className="px-3 py-4 sm:hidden lg:block" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between rounded-lg p-0.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {THEME_CYCLES.map(({ value, Icon, label }) => (
              <button
                key={value}
                onClick={() => { updateTheme(value); applyTheme(value) }}
                title={label}
                className="flex-1 flex items-center justify-center py-1.5 rounded-md cursor-pointer border-none transition-all"
                style={{
                  background: theme === value ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: theme === value ? '#ffffff' : 'rgba(255,255,255,0.3)',
                }}
              >
                <Icon size={13} />
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  )
}

function ProjectItem({ id, label, dot, onDelete }: {
  id: string; label: string; dot: string; onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const pathname = usePathname()
  const active = pathname === `/projects/${id}`

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center rounded-md"
      style={{ background: active ? 'var(--color-sidebar-active)' : 'transparent' }}
    >
      <Link
        href={`/projects/${id}`}
        className="flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-md no-underline min-w-0"
        style={{ background: 'transparent' }}
      >
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} />
        <span
          className="flex-1 text-[13px] overflow-hidden text-ellipsis whitespace-nowrap"
          style={{ color: active ? '#ffffff' : 'var(--color-sidebar-text)' }}
        >
          {label}
        </span>
        {hovered && (
          <ArrowRight size={11} className="shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }} />
        )}
      </Link>
      {hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete() }}
          title="Delete project"
          className="border-none cursor-pointer pr-2 pl-0.5 flex items-center shrink-0 transition-colors"
          style={{ background: 'transparent', color: 'rgba(255,255,255,0.3)' }}
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}

function FilterItem({ label, active, onClick, dot }: {
  label: string; active: boolean; onClick: () => void; dot: string | null
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border-none cursor-pointer text-left transition-colors"
      style={{ background: active ? 'var(--color-sidebar-active)' : 'transparent' }}
    >
      {dot !== null
        ? <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} />
        : <span className="w-1.5 shrink-0" />
      }
      <span className="text-[13px] overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: active ? '#ffffff' : 'var(--color-sidebar-text)' }}>
        {label}
      </span>
    </button>
  )
}
