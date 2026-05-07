'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateId, isoNow } from '@/lib/utils'

export interface Project {
  id: string
  title: string
  color: string
  createdAt: string
}

interface ProjectsState {
  projects: Project[]
  addProject: (partial: Partial<Project> & { title: string }) => Project
  updateProject: (id: string, patch: Partial<Project>) => void
  deleteProject: (id: string) => void
}

export const useProjectStore = create<ProjectsState>()(
  persist(
    (set) => ({
      projects: [],

      addProject: (partial) => {
        const project: Project = {
          id: generateId(),
          title: partial.title,
          color: partial.color ?? 'blue',
          createdAt: isoNow(),
        }
        set((s) => ({ projects: [...s.projects, project] }))
        return project
      },

      updateProject: (id, patch) => {
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }))
      },

      deleteProject: (id) => {
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }))
      },
    }),
    { name: 'projects' }
  )
)
