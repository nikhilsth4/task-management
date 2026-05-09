'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { useProjectStore } from '@/store/projects'
import { useTaskStore } from '@/store/tasks'
import { useUIStore } from '@/store/ui'
import TaskDetail from '@/components/task/TaskDetail'
import ProjectTaskList from '@/components/project/ProjectTaskList'
import ProjectChat from '@/components/project/ProjectChat'

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const project = useProjectStore((s) => s.projects.find((p) => p.id === id))
  const taskCount = useTaskStore((s) => s.tasks.filter((t) => t.projectId === id).length)
  const doneCount = useTaskStore((s) => s.tasks.filter((t) => t.projectId === id && t.status === 'done').length)
  const selectedTaskId = useUIStore((s) => s.selectedTaskId)

  useEffect(() => {
    if (!project) router.replace('/')
  }, [project, router])

  if (!project) return null

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--color-canvas)' }}>
      {/* Header */}
      <div
        className="px-6 py-4 shrink-0"
        style={{ borderBottom: '1px solid var(--color-hairline)', background: 'var(--color-canvas)' }}
      >
        <h1 className="text-[18px] font-semibold m-0" style={{ color: 'var(--color-ink)' }}>
          {project.title}
        </h1>
        <p className="text-[12px] m-0 mt-0.5" style={{ color: 'var(--color-slate)' }}>
          {taskCount} task{taskCount !== 1 ? 's' : ''} · {doneCount} done
        </p>
      </div>

      {/* Task list — scrollable */}
      <div className="flex-1 overflow-y-auto">
        <ProjectTaskList projectId={id} />
      </div>

      {/* AI Chat — fixed height at bottom */}
      <ProjectChat projectId={id} projectTitle={project.title} />

      {/* TaskDetail drawer */}
      <AnimatePresence>{selectedTaskId && <TaskDetail />}</AnimatePresence>
    </div>
  )
}
