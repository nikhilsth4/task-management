'use client'

import { useEffect } from 'react'
import { useTaskStore } from '@/store/tasks'
import { useProjectStore } from '@/store/projects'
import { useUIStore } from '@/store/ui'
import { subscribeToTasks, subscribeToProjects } from '@/lib/realtime'
import { createClient } from '@/lib/supabase/client'

export default function AppLoader() {
  const fetchTasks = useTaskStore((s) => s.fetchTasks)
  const fetchProjects = useProjectStore((s) => s.fetchProjects)
  const setRealtimeConnected = useUIStore((s) => s.setRealtimeConnected)

  useEffect(() => {
    fetchProjects()
    fetchTasks()

    let tasksChannel: Awaited<ReturnType<typeof subscribeToTasks>> | null = null
    let projectsChannel: Awaited<ReturnType<typeof subscribeToProjects>> | null = null

    createClient().auth.getUser().then(({ data }) => {
      const userId = data.user?.id
      if (!userId) return
      tasksChannel = subscribeToTasks(userId, setRealtimeConnected)
      projectsChannel = subscribeToProjects(userId, setRealtimeConnected)
    })

    return () => {
      tasksChannel?.unsubscribe()
      projectsChannel?.unsubscribe()
    }
  }, [])

  return null
}
