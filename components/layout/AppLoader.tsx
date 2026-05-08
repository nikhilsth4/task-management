'use client'

import { useEffect } from 'react'
import { useTaskStore } from '@/store/tasks'
import { useProjectStore } from '@/store/projects'

export default function AppLoader() {
  const fetchTasks = useTaskStore((s) => s.fetchTasks)
  const fetchProjects = useProjectStore((s) => s.fetchProjects)

  useEffect(() => {
    fetchProjects()
    fetchTasks()
  }, [])

  return null
}
