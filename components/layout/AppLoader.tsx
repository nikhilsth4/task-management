'use client'

import { useEffect } from 'react'
import { useTaskStore } from '@/store/tasks'
import { useProjectStore } from '@/store/projects'
import { useUIStore } from '@/store/ui'
import { subscribeToTasks, subscribeToProjects } from '@/lib/realtime'

export default function AppLoader() {
  const fetchTasks = useTaskStore((s) => s.fetchTasks)
  const fetchProjects = useProjectStore((s) => s.fetchProjects)
  const setRealtimeConnected = useUIStore((s) => s.setRealtimeConnected)

  useEffect(() => {
    fetchProjects()
    fetchTasks()

    const tasksChannel = subscribeToTasks(setRealtimeConnected)
    const projectsChannel = subscribeToProjects(setRealtimeConnected)

    return () => {
      tasksChannel.unsubscribe()
      projectsChannel.unsubscribe()
    }
  }, [])

  return null
}
