import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { dbToTask, dbToProject, type DbTask, type DbProject } from '@/lib/supabase/mappers'
import { useTaskStore } from '@/store/tasks'
import { useProjectStore } from '@/store/projects'

export function subscribeToTasks(onStatusChange: (connected: boolean) => void): RealtimeChannel {
  const supabase = createClient()

  return supabase
    .channel('tasks')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, (payload) => {
      const row = payload.new as DbTask
      const { tasks } = useTaskStore.getState()
      // Skip if already present — our own optimistic insert
      if (tasks.find((t) => t.id === row.id)) return
      useTaskStore.setState({ tasks: [...tasks, dbToTask(row)] })
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' }, (payload) => {
      const row = payload.new as DbTask
      useTaskStore.setState((s) => ({
        tasks: s.tasks.map((t) => (t.id === row.id ? dbToTask(row) : t)),
      }))
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tasks' }, (payload) => {
      const id = (payload.old as { id: string }).id
      useTaskStore.setState((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
    })
    .subscribe((status) => {
      onStatusChange(status === 'SUBSCRIBED')
    })
}

export function subscribeToProjects(onStatusChange: (connected: boolean) => void): RealtimeChannel {
  const supabase = createClient()

  return supabase
    .channel('projects')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'projects' }, (payload) => {
      const row = payload.new as DbProject
      const { projects } = useProjectStore.getState()
      if (projects.find((p) => p.id === row.id)) return
      useProjectStore.setState({ projects: [...projects, dbToProject(row)] })
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'projects' }, (payload) => {
      const row = payload.new as DbProject
      useProjectStore.setState((s) => ({
        projects: s.projects.map((p) => (p.id === row.id ? dbToProject(row) : p)),
      }))
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'projects' }, (payload) => {
      const id = (payload.old as { id: string }).id
      useProjectStore.setState((s) => ({ projects: s.projects.filter((p) => p.id !== id) }))
    })
    .subscribe((status) => {
      onStatusChange(status === 'SUBSCRIBED')
    })
}
