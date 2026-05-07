'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as yup from 'yup'
import { useTaskStore, type Recurrence, type Status, type Urgency, type Importance } from '@/store/tasks'
import { useProjectStore } from '@/store/projects'
import { useUIStore } from '@/store/ui'
import { X, Trash2, Timer } from 'lucide-react'

// ── Validation schemas ─────────────────────────────────────────────────────────

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

// ── Component ──────────────────────────────────────────────────────────────────

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

  // Sync local draft state when the selected task changes
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

  // Close drawer if task was deleted externally
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

  function saveNotes() {
    updateTask(task!.id, { notes })
  }

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
    if (next === 'done') {
      completeTask(task!.id)
    } else {
      updateTask(task!.id, { status: next, completedAt: null })
    }
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
      if (err instanceof yup.ValidationError) {
        setErrors((e) => ({ ...e, tagInput: err.message }))
      }
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
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 40 }}
      />

      {/* Drawer */}
      <motion.aside
        initial={{ x: 420 }}
        animate={{ x: 0 }}
        exit={{ x: 420 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
          background: '#FFFFFF', borderLeft: '1px solid #E8E6E0',
          zIndex: 50, display: 'flex', flexDirection: 'column', overflowY: 'auto',
        }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #F0EEE9', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {project && (
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR_MAP[project.color] ?? '#E5E7EB', flexShrink: 0 }} />
            )}
            <span style={{ fontSize: 12, color: '#AAAAAA' }}>
              {project ? project.title : 'Inbox'}
            </span>
          </div>
          <button
            onClick={() => setSelectedTaskId(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#AAAAAA', padding: 4, display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Title */}
          <div>
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((er) => ({ ...er, title: undefined })) }}
              onFocus={() => setTitleFocused(true)}
              onBlur={() => { setTitleFocused(false); saveTitle() }}
              style={{
                fontSize: 18, fontWeight: 600, color: '#141414',
                border: 'none',
                borderBottom: errors.title
                  ? '1px solid #DC2626'
                  : titleFocused ? '1px solid #141414' : '1px solid #E8E6E0',
                outline: 'none', background: 'none',
                width: '100%', fontFamily: 'inherit', padding: '0 0 2px',
                transition: 'border-color 0.15s',
              }}
            />
            {errors.title && <p style={errorStyle}>{errors.title}</p>}
          </div>

          {/* Status */}
          <Field label="Status">
            <div style={{ display: 'flex', gap: 6 }}>
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
          <div style={{ display: 'flex', gap: 16 }}>
            <Field label="Urgency" style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['high', 'low'] as Urgency[]).map((v) => (
                  <ToggleBtn key={v} active={task.urgency === v} onClick={() => updateTask(task.id, { urgency: v })} label={v === 'high' ? 'High' : 'Low'} />
                ))}
              </div>
            </Field>
            <Field label="Importance" style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 6 }}>
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
              style={selectStyle}
            >
              <option value="">Inbox</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </Field>

          {/* Schedule */}
          <div style={{ display: 'flex', gap: 16 }}>
            <Field label="Date" style={{ flex: 1 }}>
              <input type="date" value={task.scheduledDate ?? ''} onChange={(e) => updateTask(task.id, { scheduledDate: e.target.value || null })} style={inputStyle} />
            </Field>
            <Field label="Time" style={{ flex: 1 }}>
              <input type="time" value={task.scheduledTime ?? ''} onChange={(e) => updateTask(task.id, { scheduledTime: e.target.value || null })} style={inputStyle} />
            </Field>
          </div>

          {/* Duration + Recurrence */}
          <div style={{ display: 'flex', gap: 16 }}>
            <Field label="Duration (min)" style={{ flex: 1 }}>
              <input
                type="number"
                min={1}
                value={durationStr}
                onChange={(e) => { setDurationStr(e.target.value); setErrors((er) => ({ ...er, duration: undefined })) }}
                onBlur={saveDuration}
                style={{ ...inputStyle, borderColor: errors.duration ? '#DC2626' : '#E8E6E0' }}
                placeholder="30"
              />
              {errors.duration && <p style={errorStyle}>{errors.duration}</p>}
            </Field>
            <Field label="Recurrence" style={{ flex: 1 }}>
              <select value={task.recurrence} onChange={(e) => updateTask(task.id, { recurrence: e.target.value as Recurrence })} style={selectStyle}>
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="weekdays">Weekdays</option>
                <option value="custom">Custom</option>
              </select>
            </Field>
          </div>

          {/* Tags */}
          <Field label="Tags">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: task.tags.length ? 8 : 0 }}>
              {task.tags.map((tag) => (
                <span key={tag} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: '#F3F4F6', borderRadius: 4, padding: '3px 8px', fontSize: 12, color: '#555',
                }}>
                  {tag}
                  <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#AAAAAA', padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>
                </span>
              ))}
            </div>
            <input
              value={tagInput}
              onChange={(e) => { setTagInput(e.target.value); setErrors((er) => ({ ...er, tagInput: undefined })) }}
              onKeyDown={addTag}
              placeholder="Type and press Enter"
              style={{ ...inputStyle, borderColor: errors.tagInput ? '#DC2626' : '#E8E6E0', width: '100%', boxSizing: 'border-box' }}
            />
            {errors.tagInput && <p style={errorStyle}>{errors.tagInput}</p>}
          </Field>

          {/* Notes */}
          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              rows={4}
              placeholder="Add notes…"
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </Field>

          {task.pomodoroSessions > 0 && (
            <p style={{ fontSize: 12, color: '#AAAAAA', margin: 0 }}>
              {task.pomodoroSessions} pomodoro session{task.pomodoroSessions !== 1 ? 's' : ''} completed
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px', borderTop: '1px solid #F0EEE9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
        }}>
          <button
            onClick={handleDelete}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: '1px solid',
              borderColor: confirmDelete ? '#DC2626' : '#E8E6E0',
              color: confirmDelete ? '#DC2626' : '#AAAAAA',
              borderRadius: 6, padding: '7px 12px', fontSize: 12, cursor: 'pointer',
            }}
          >
            <Trash2 size={13} />
            {confirmDelete ? 'Confirm delete' : 'Delete'}
          </button>

          {task!.status !== 'done' ? (
            <button
              onClick={() => { completeTask(task!.id); setSelectedTaskId(null) }}
              style={{
                background: '#16A34A', color: '#FFFFFF',
                border: 'none', borderRadius: 6,
                padding: '7px 14px', fontSize: 12, fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Mark Done
            </button>
          ) : (
            <button
              onClick={() => updateTask(task!.id, { status: 'todo', completedAt: null })}
              style={{
                background: 'none', color: '#6B7280',
                border: '1px solid #E8E6E0', borderRadius: 6,
                padding: '7px 14px', fontSize: 12, fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Reopen
            </button>
          )}

          <button
            onClick={() => { startPomodoro(task!.id); setSelectedTaskId(null) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#141414', color: '#FFFFFF',
              border: 'none', borderRadius: 6,
              padding: '7px 14px', fontSize: 12, fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Timer size={13} />
            Focus
          </button>
        </div>
      </motion.aside>
    </>
  )
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#AAAAAA', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 6px' }}>
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
      style={{
        padding: '5px 12px', fontSize: 12, borderRadius: 5, cursor: 'pointer',
        border: active ? '1px solid #141414' : '1px solid #E8E6E0',
        background: active ? '#141414' : '#FFFFFF',
        color: active ? '#FFFFFF' : '#666',
        fontWeight: active ? 600 : 400,
        transition: 'all 0.1s',
      }}
    >
      {label}
    </button>
  )
}

const errorStyle: React.CSSProperties = {
  margin: '4px 0 0',
  fontSize: 11,
  color: '#DC2626',
}

const inputStyle: React.CSSProperties = {
  padding: '7px 10px',
  fontSize: 13,
  border: '1px solid #E8E6E0',
  borderRadius: 6,
  outline: 'none',
  background: '#FAFAF9',
  color: '#141414',
  width: '100%',
  boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'auto',
}
