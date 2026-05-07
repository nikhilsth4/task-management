'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import * as yup from 'yup'
import { useTaskStore, type Recurrence, type Status, type Urgency, type Importance } from '@/store/tasks'
import { useProjectStore } from '@/store/projects'
import { useUIStore } from '@/store/ui'
import { X, Trash2, Timer } from 'lucide-react'

const titleSchema = yup.string().required('Title is required').min(1).max(200, 'Max 200 characters')

const durationSchema = yup
  .number()
  .nullable()
  .transform((v, orig) => (orig === '' ? null : v))
  .positive('Must be greater than 0')
  .integer('Whole numbers only')

const tagSchema = yup
  .string()
  .required('Tag cannot be empty')
  .min(1)
  .max(30, 'Max 30 characters')
  .matches(/^[^\s,]+$/, 'No spaces or commas')

const COLOR_MAP: Record<string, string> = {
  blue: '#3B82F6', rose: '#F43F5E', green: '#22C55E', amber: '#F59E0B',
  purple: '#A855F7', cyan: '#06B6D4', orange: '#F97316', teal: '#14B8A6',
}

interface FieldErrors {
  title?: string
  duration?: string
  tagInput?: string
}

export default function TaskDetail() {
  const selectedTaskId = useUIStore((s) => s.selectedTaskId)
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId)
  const startPomodoro = useUIStore((s) => s.startPomodoro)
  const task = useTaskStore((s) => s.tasks.find((t) => t.id === selectedTaskId))
  const updateTask = useTaskStore((s) => s.updateTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const completeTask = useTaskStore((s) => s.completeTask)
  const projects = useProjectStore((s) => s.projects)

  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [durationStr, setDurationStr] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [titleFocused, setTitleFocused] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setNotes(task.notes)
      setDurationStr(task.duration != null ? String(task.duration) : '')
      setTagInput('')
      setErrors({})
      setConfirmDelete(false)
    }
  }, [task?.id])

  useEffect(() => {
    if (selectedTaskId && !task) setSelectedTaskId(null)
  }, [task, selectedTaskId, setSelectedTaskId])

  if (!selectedTaskId || !task) return null

  function saveTitle() {
    try {
      const valid = titleSchema.validateSync(title.trim())
      updateTask(task!.id, { title: valid })
      setErrors((e) => ({ ...e, title: undefined }))
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        setErrors((e) => ({ ...e, title: err.message }))
        setTitle(task!.title)
      }
    }
  }

  function saveNotes() { updateTask(task!.id, { notes }) }

  function saveDuration() {
    try {
      const valid = durationSchema.validateSync(durationStr)
      updateTask(task!.id, { duration: valid ?? null })
      setErrors((e) => ({ ...e, duration: undefined }))
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        setErrors((e) => ({ ...e, duration: err.message }))
        setDurationStr(task!.duration != null ? String(task!.duration) : '')
      }
    }
  }

  function toggleStatus(next: Status) {
    if (next === 'done') completeTask(task!.id)
    else updateTask(task!.id, { status: next, completedAt: null })
  }

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    try {
      const valid = tagSchema.validateSync(tagInput.trim())
      if (task!.tags.includes(valid)) {
        setErrors((e) => ({ ...e, tagInput: 'Tag already added' }))
        return
      }
      updateTask(task!.id, { tags: [...task!.tags, valid] })
      setTagInput('')
      setErrors((e) => ({ ...e, tagInput: undefined }))
    } catch (err) {
      if (err instanceof yup.ValidationError) setErrors((e) => ({ ...e, tagInput: err.message }))
    }
  }

  function removeTag(tag: string) {
    updateTask(task!.id, { tags: task!.tags.filter((t) => t !== tag) })
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    deleteTask(task!.id)
    setSelectedTaskId(null)
  }

  const project = projects.find((p) => p.id === task.projectId)

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={() => setSelectedTaskId(null)}
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.25)' }}
      />

      {/* Drawer */}
      <motion.aside
        initial={{ x: 420 }}
        animate={{ x: 0 }}
        exit={{ x: 420 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className="fixed top-0 right-0 bottom-0 w-[420px] z-50 flex flex-col overflow-y-auto"
        style={{ background: 'var(--color-canvas)', borderLeft: '1px solid var(--color-hairline)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--color-hairline)' }}
        >
          <div className="flex items-center gap-2">
            {project && (
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLOR_MAP[project.color] ?? 'var(--color-hairline)' }} />
            )}
            <span className="text-[12px]" style={{ color: 'var(--color-slate)' }}>
              {project ? project.title : 'Inbox'}
            </span>
          </div>
          <button
            onClick={() => setSelectedTaskId(null)}
            className="flex items-center justify-center p-1 rounded cursor-pointer bg-transparent border-none"
            style={{ color: 'var(--color-slate)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 flex flex-col gap-5">

          {/* Title */}
          <div>
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((er) => ({ ...er, title: undefined })) }}
              onFocus={() => setTitleFocused(true)}
              onBlur={() => { setTitleFocused(false); saveTitle() }}
              className="w-full text-[18px] font-semibold bg-transparent outline-none pb-0.5 font-[inherit] transition-[border-color] duration-150"
              style={{
                color: 'var(--color-ink)',
                border: 'none',
                borderBottom: errors.title
                  ? '1px solid #DC2626'
                  : titleFocused ? '1px solid var(--color-ink)' : '1px solid var(--color-hairline)',
              }}
            />
            {errors.title && <p className="mt-1 text-[11px] text-red-600">{errors.title}</p>}
          </div>

          {/* Status */}
          <Field label="Status">
            <div className="flex gap-1.5">
              {(['todo', 'in_progress', 'done'] as Status[]).map((s) => (
                <ToggleBtn
                  key={s}
                  active={task.status === s}
                  onClick={() => toggleStatus(s)}
                  label={s === 'todo' ? 'To Do' : s === 'in_progress' ? 'In Progress' : 'Done'}
                />
              ))}
            </div>
          </Field>

          {/* Urgency + Importance */}
          <div className="flex gap-4">
            <Field label="Urgency" className="flex-1">
              <div className="flex gap-1.5">
                {(['high', 'low'] as Urgency[]).map((v) => (
                  <ToggleBtn key={v} active={task.urgency === v} onClick={() => updateTask(task.id, { urgency: v })} label={v === 'high' ? 'High' : 'Low'} />
                ))}
              </div>
            </Field>
            <Field label="Importance" className="flex-1">
              <div className="flex gap-1.5">
                {(['high', 'low'] as Importance[]).map((v) => (
                  <ToggleBtn key={v} active={task.importance === v} onClick={() => updateTask(task.id, { importance: v })} label={v === 'high' ? 'High' : 'Low'} />
                ))}
              </div>
            </Field>
          </div>

          {/* Project */}
          <Field label="Project">
            <select
              value={task.projectId ?? ''}
              onChange={(e) => updateTask(task.id, { projectId: e.target.value || null })}
              className="w-full px-2.5 py-1.5 text-[13px] rounded-md cursor-pointer outline-none"
              style={{
                border: '1px solid var(--color-hairline)',
                background: 'var(--color-surface)',
                color: 'var(--color-ink)',
              }}
            >
              <option value="">Inbox</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </Field>

          {/* Schedule */}
          <div className="flex gap-4">
            <Field label="Date" className="flex-1">
              <FormInput type="date" value={task.scheduledDate ?? ''} onChange={(e) => updateTask(task.id, { scheduledDate: e.target.value || null })} />
            </Field>
            <Field label="Time" className="flex-1">
              <FormInput type="time" value={task.scheduledTime ?? ''} onChange={(e) => updateTask(task.id, { scheduledTime: e.target.value || null })} />
            </Field>
          </div>

          {/* Duration + Recurrence */}
          <div className="flex gap-4">
            <Field label="Duration (min)" className="flex-1">
              <FormInput
                type="number"
                min={1}
                value={durationStr}
                onChange={(e) => { setDurationStr(e.target.value); setErrors((er) => ({ ...er, duration: undefined })) }}
                onBlur={saveDuration}
                placeholder="30"
                error={!!errors.duration}
              />
              {errors.duration && <p className="mt-1 text-[11px] text-red-600">{errors.duration}</p>}
            </Field>
            <Field label="Recurrence" className="flex-1">
              <select
                value={task.recurrence}
                onChange={(e) => updateTask(task.id, { recurrence: e.target.value as Recurrence })}
                className="w-full px-2.5 py-1.5 text-[13px] rounded-md cursor-pointer outline-none"
                style={{
                  border: '1px solid var(--color-hairline)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-ink)',
                }}
              >
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="weekdays">Weekdays</option>
                <option value="custom">Custom</option>
              </select>
            </Field>
          </div>

          {/* Custom day picker */}
          {task.recurrence === 'custom' && (
            <Field label="Repeat on">
              <div className="flex gap-1.5">
                {['S','M','T','W','T','F','S'].map((dayLabel, i) => {
                  const active = (task.customDays ?? []).includes(i)
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        const days = task.customDays ?? []
                        const next = active ? days.filter((d) => d !== i) : [...days, i].sort()
                        updateTask(task.id, { customDays: next })
                      }}
                      className="w-[30px] h-[30px] rounded-full text-[11px] font-semibold cursor-pointer transition-colors duration-100"
                      style={{
                        border: '1px solid',
                        borderColor: active ? 'var(--color-blue-action)' : 'var(--color-hairline)',
                        background: active ? 'var(--color-blue-action)' : 'transparent',
                        color: active ? '#FFFFFF' : 'var(--color-slate)',
                      }}
                    >
                      {dayLabel}
                    </button>
                  )
                })}
              </div>
            </Field>
          )}

          {/* Tags */}
          <Field label="Tags">
            {task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[12px]"
                    style={{ background: 'var(--color-stone)', color: 'var(--color-ink)' }}
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="bg-transparent border-none cursor-pointer leading-none text-[14px] p-0"
                      style={{ color: 'var(--color-slate)' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <FormInput
              value={tagInput}
              onChange={(e) => { setTagInput(e.target.value); setErrors((er) => ({ ...er, tagInput: undefined })) }}
              onKeyDown={addTag}
              placeholder="Type and press Enter"
              error={!!errors.tagInput}
            />
            {errors.tagInput && <p className="mt-1 text-[11px] text-red-600">{errors.tagInput}</p>}
          </Field>

          {/* Notes */}
          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              rows={4}
              placeholder="Add notes…"
              className="w-full px-2.5 py-1.5 text-[13px] rounded-md outline-none resize-y font-[inherit]"
              style={{
                border: '1px solid var(--color-hairline)',
                background: 'var(--color-surface)',
                color: 'var(--color-ink)',
              }}
            />
          </Field>

          {task.pomodoroSessions > 0 && (
            <p className="text-[12px] m-0" style={{ color: 'var(--color-slate)' }}>
              {task.pomodoroSessions} pomodoro session{task.pomodoroSessions !== 1 ? 's' : ''} completed
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex justify-between items-center px-5 py-4 shrink-0"
          style={{ borderTop: '1px solid var(--color-hairline)' }}
        >
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] cursor-pointer bg-transparent transition-colors duration-100"
            style={{
              border: '1px solid',
              borderColor: confirmDelete ? '#DC2626' : 'var(--color-hairline)',
              color: confirmDelete ? '#DC2626' : 'var(--color-slate)',
            }}
          >
            <Trash2 size={13} />
            {confirmDelete ? 'Confirm delete' : 'Delete'}
          </button>

          {task.status !== 'done' ? (
            <button
              onClick={() => { completeTask(task!.id); setSelectedTaskId(null) }}
              className="rounded-md px-3.5 py-1.5 text-[12px] font-medium cursor-pointer border-none text-white"
              style={{ background: '#16A34A' }}
            >
              Mark Done
            </button>
          ) : (
            <button
              onClick={() => updateTask(task!.id, { status: 'todo', completedAt: null })}
              className="rounded-md px-3.5 py-1.5 text-[12px] font-medium cursor-pointer bg-transparent"
              style={{
                border: '1px solid var(--color-hairline)',
                color: 'var(--color-slate)',
              }}
            >
              Reopen
            </button>
          )}

          <button
            onClick={() => { startPomodoro(task!.id); setSelectedTaskId(null) }}
            className="flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[12px] font-medium cursor-pointer border-none text-white"
            style={{ background: 'var(--color-blue-action)' }}
          >
            <Timer size={13} />
            Focus
          </button>
        </div>
      </motion.aside>
    </>
  )
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p
        className="text-[11px] font-semibold tracking-[0.06em] uppercase m-0 mb-1.5"
        style={{ color: 'var(--color-slate)' }}
      >
        {label}
      </p>
      {children}
    </div>
  )
}

function ToggleBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 text-[12px] rounded-md cursor-pointer transition-all duration-100"
      style={{
        border: '1px solid',
        borderColor: active ? 'var(--color-ink)' : 'var(--color-hairline)',
        background: active ? 'var(--color-ink)' : 'transparent',
        color: active ? 'var(--color-canvas)' : 'var(--color-slate)',
        fontWeight: active ? 600 : 400,
      }}
    >
      {label}
    </button>
  )
}

function FormInput({
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      {...props}
      className="w-full px-2.5 py-1.5 text-[13px] rounded-md outline-none"
      style={{
        border: '1px solid',
        borderColor: error ? '#DC2626' : 'var(--color-hairline)',
        background: 'var(--color-surface)',
        color: 'var(--color-ink)',
      }}
    />
  )
}
