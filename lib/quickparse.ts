import type { Project } from '@/store/projects'

export interface ParsedCapture {
  title: string
  projectId: string | null
  scheduledDate: string | null
  scheduledTime: string | null
  urgency: 'high' | 'low'
  importance: 'high' | 'low'
  // Display chips for UI preview
  chips: {
    project?: { id: string; title: string; color: string }
    date?: { iso: string; label: string }
    time?: { iso: string; label: string }
    urgent?: boolean
    important?: boolean
  }
}

const WEEKDAY_INDEX: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function nextWeekdayDate(targetDow: number, from: Date): Date {
  const d = new Date(from)
  const cur = d.getDay()
  let diff = targetDow - cur
  if (diff <= 0) diff += 7
  d.setDate(d.getDate() + diff)
  return d
}

function formatDateLabel(iso: string, today: Date): string {
  const todayIso = isoDate(today)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const tomorrowIso = isoDate(tomorrow)
  if (iso === todayIso) return 'Today'
  if (iso === tomorrowIso) return 'Tomorrow'
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTimeLabel(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  const period = h < 12 ? 'AM' : 'PM'
  return m === 0 ? `${hour12} ${period}` : `${hour12}:${pad2(m)} ${period}`
}

function fuzzyMatchProject(query: string, projects: Project[]): Project | null {
  const q = query.toLowerCase()
  // Exact (case-insensitive) wins
  const exact = projects.find((p) => p.title.toLowerCase() === q)
  if (exact) return exact
  // Then prefix match (e.g. "wo" → "Work")
  const prefix = projects.find((p) => p.title.toLowerCase().startsWith(q))
  if (prefix) return prefix
  // Then any-substring match
  const sub = projects.find((p) => p.title.toLowerCase().includes(q))
  return sub ?? null
}

/**
 * Parse a quick-capture input string for inline tokens.
 *
 * Tokens:
 *   #ProjectName  → fuzzy match to a project
 *   !today | !tomorrow | !monday..!sunday | !YYYY-MM-DD  → scheduled date
 *   @9am | @9:30am | @14:00 | @2pm  → scheduled time
 *   !!  → urgency: high
 *   !!! → urgency: high + importance: high
 *
 * Tokens are stripped from the returned title.
 */
export function parseQuickCapture(input: string, projects: Project[]): ParsedCapture {
  const today = new Date()
  let working = ` ${input} `
  const chips: ParsedCapture['chips'] = {}

  let projectId: string | null = null
  let scheduledDate: string | null = null
  let scheduledTime: string | null = null
  let urgency: 'high' | 'low' = 'low'
  let importance: 'high' | 'low' = 'low'

  // ----- Urgency / importance: !!! before !! before single-bang dates -----
  // We scan for !!! first to avoid !! shadowing it.
  if (/(?:^|\s)!!!(?=\s|$)/.test(working)) {
    urgency = 'high'
    importance = 'high'
    chips.urgent = true
    chips.important = true
    working = working.replace(/(?:^|\s)!!!(?=\s|$)/g, ' ')
  } else if (/(?:^|\s)!!(?=\s|$)/.test(working)) {
    urgency = 'high'
    chips.urgent = true
    working = working.replace(/(?:^|\s)!!(?=\s|$)/g, ' ')
  }

  // ----- @time -----
  const timeRe = /(?:^|\s)@(\d{1,2})(?::(\d{2}))?\s*(am|pm)?(?=\s|$)/i
  const timeMatch = working.match(timeRe)
  if (timeMatch) {
    let h = parseInt(timeMatch[1], 10)
    const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0
    const period = timeMatch[3]?.toLowerCase()
    if (period === 'pm' && h < 12) h += 12
    if (period === 'am' && h === 12) h = 0
    if (h >= 0 && h < 24 && m >= 0 && m < 60) {
      scheduledTime = `${pad2(h)}:${pad2(m)}`
      chips.time = { iso: scheduledTime, label: formatTimeLabel(scheduledTime) }
      working = working.replace(timeRe, ' ')
    }
  }

  // ----- !date -----
  const isoDateRe = /(?:^|\s)!(\d{4}-\d{2}-\d{2})(?=\s|$)/
  const isoDateMatch = working.match(isoDateRe)
  if (isoDateMatch) {
    scheduledDate = isoDateMatch[1]
    chips.date = { iso: scheduledDate, label: formatDateLabel(scheduledDate, today) }
    working = working.replace(isoDateRe, ' ')
  } else {
    const namedDateRe = /(?:^|\s)!(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?=\s|$)/i
    const namedMatch = working.match(namedDateRe)
    if (namedMatch) {
      const word = namedMatch[1].toLowerCase()
      let date: Date
      if (word === 'today') {
        date = today
      } else if (word === 'tomorrow') {
        date = new Date(today)
        date.setDate(today.getDate() + 1)
      } else {
        date = nextWeekdayDate(WEEKDAY_INDEX[word], today)
      }
      scheduledDate = isoDate(date)
      chips.date = { iso: scheduledDate, label: formatDateLabel(scheduledDate, today) }
      working = working.replace(namedDateRe, ' ')
    }
  }

  // ----- #Project -----
  const projectRe = /(?:^|\s)#(\S+)/
  const projectMatch = working.match(projectRe)
  if (projectMatch) {
    const query = projectMatch[1]
    const matched = fuzzyMatchProject(query, projects)
    if (matched) {
      projectId = matched.id
      chips.project = { id: matched.id, title: matched.title, color: matched.color }
    }
    working = working.replace(projectRe, ' ')
  }

  const title = working.replace(/\s+/g, ' ').trim()

  return { title, projectId, scheduledDate, scheduledTime, urgency, importance, chips }
}
