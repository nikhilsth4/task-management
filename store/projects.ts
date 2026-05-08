'use client'

import { create } from 'zustand'
import { isoNow } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { dbToProject } from '@/lib/supabase/mappers'

export interface Project {
  id: string
  title: string
  color: string
  createdAt: string
}

interface ProjectsState {
  projects: Project[]
  loading: boolean
  fetchProjects: () => Promise<void>
  addProject: (partial: Partial<Project> & { title: string }) => Project
  updateProject: (id: string, patch: Partial<Project>) => void
  deleteProject: (id: string) => void
}

export const useProjectStore = create<ProjectsState>()((set) => ({
  projects: [],
  loading: false,

  fetchProjects: async () => {
    set({ loading: true })
    const supabase = createClient()
    const { data, error } = await supabase.from('projects').select('*').order('created_at')
    if (error) { console.error('fetchProjects:', error.message, error.code, error.details); set({ loading: false }); return }
    set({ projects: (data ?? []).map(dbToProject), loading: false })
  },

  addProject: (partial) => {
    const project: Project = {
      id: crypto.randomUUID(),
      title: partial.title,
      color: partial.color ?? 'blue',
      createdAt: isoNow(),
    }
    set((s) => ({ projects: [...s.projects, project] }))
    const supabase = createClient()
    supabase.from('projects').insert({ id: project.id, title: project.title, color: project.color, created_at: project.createdAt })
      .then(({ error }) => { if (error) console.error('addProject:', error) })
    return project
  },

  updateProject: (id, patch) => {
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))
    const supabase = createClient()
    const dbPatch: Record<string, unknown> = {}
    if (patch.title !== undefined) dbPatch.title = patch.title
    if (patch.color !== undefined) dbPatch.color = patch.color
    supabase.from('projects').update(dbPatch).eq('id', id)
      .then(({ error }) => { if (error) console.error('updateProject:', error) })
  },

  deleteProject: (id) => {
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }))
    const supabase = createClient()
    supabase.from('projects').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('deleteProject:', error) })
  },
}))
