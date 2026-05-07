# CLAUDE.md — Daily Task Manager

## Project Overview

A daily time management app built with Next.js (latest, App Router). It helps users capture, prioritize, schedule, and focus on tasks across four complementary views — all powered by a single shared data model. Look for docs/plan.md

---

## Tech Stack

- **Framework**: Next.js (latest, App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Persistence**: localStorage (MVP) — swap for DB later
- **Animations**: Framer Motion
- **Drag and Drop**: dnd-kit
- **Deployment**: Vercel

---

## Execution Rules

- Only modify files listed in each part
- Output diffs only
- No refactors outside scope
- Ask if model interface is unclear

---

## Workflow

Every part follows this sequence:

1. Create branch: `feat/part-X`
2. Phase 0 (if required for this part)
3. Implement scoped changes only
4. Spec review — does it match the design and behavior requirements?
5. Code review — is it simple, typed correctly, no dead code?
6. Merge to main

---

## Testing Strategy

**Tier 1 — Always required**
- Feature works end-to-end
- No console or runtime errors

**Tier 2 — Required for logic and state**
- Hooks
- Async flows (loading, error, success)
- Input interactions (keyboard behavior)

**Tier 3 — Selective**
- UI tests only when behavior matters, not styling
- If a test would only verify a Tailwind class, skip it

**Never write tests for:**
- Tailwind class names
- Static presentational components with no logic
- Duplicate coverage (don't unit + integration test the same thing)

---

## Data Model

All views are just lenses on this shared model. Do not create separate data structures per view.

```ts
type Recurrence = 'none' | 'daily' | 'weekly' | 'weekdays' | 'custom'
type Status = 'todo' | 'in_progress' | 'done'
type Urgency = 'high' | 'low'
type Importance = 'high' | 'low'

interface Project {
  id: string
  title: string
  color: string         // Tailwind color token e.g. 'blue', 'rose'
  createdAt: string     // ISO date
}

interface Task {
  id: string
  projectId: string | null    // null = inbox / unassigned

  title: string
  notes: string

  urgency: Urgency
  importance: Importance
  status: Status

  scheduledDate: string | null  // ISO date
  scheduledTime: string | null  // 'HH:MM'
  duration: number | null       // minutes

  recurrence: Recurrence

  pomodoroSessions: number      // total completed sessions

  tags: string[]

  createdAt: string             // ISO datetime
  completedAt: string | null    // ISO datetime
}
```

---

## App Structure

```
app/
  (today)/
    page.tsx              # Default view — Today's tasks
  review/
    page.tsx              # Weekly progress dashboard
  settings/
    page.tsx              # Preferences

components/
  views/
    MatrixView.tsx        # Eisenhower Matrix
    ListView.tsx          # Prioritized task list
    TimelineView.tsx      # Hour-by-hour daily schedule
    KanbanView.tsx        # To Do / In Progress / Done
  task/
    TaskCard.tsx          # Shared card used across views
    TaskDetail.tsx        # Full task edit drawer/modal
    QuickCapture.tsx      # Always-visible input bar
  pomodoro/
    PomodoroOverlay.tsx   # Focus mode — fullscreen timer
  layout/
    ViewSwitcher.tsx      # Matrix | List | Timeline | Kanban tabs
    Sidebar.tsx           # Projects + nav

store/
  tasks.ts               # Zustand store — tasks CRUD
  projects.ts            # Zustand store — projects CRUD
  ui.ts                  # Active view, selected task, timer state

lib/
  utils.ts
  constants.ts
```

---

## Views — Behavior Contract

### Eisenhower Matrix
- 2×2 grid: Urgent+Important / Not Urgent+Important / Urgent+Not Important / Neither
- Task cards draggable between quadrants — updates `urgency` + `importance`

### Task List
- Flat list of tasks sorted by quadrant priority (Q1 → Q2 → Q3 → Q4)
- Filterable by project, tag, date

### Daily Timeline
- Hour-by-hour grid (default: 06:00 – 22:00, configurable in settings)
- Tasks draggable into time slots; sets `scheduledDate` and `scheduledTime`
- Overlapping tasks rendered side by side (proportional widths)
- Unscheduled tasks panel on the side for drag-and-drop

### Kanban
- Three columns: **To Do** / **In Progress** / **Done**
- Dragging a card between columns updates `status`
- Cards color-coded by `project.color`

---

## Features

### Quick Capture
- Always visible at the top of every view
- Press `/` or `N` to focus it from anywhere
- Default: creates a task in Inbox (no project), `urgency: low`, `importance: low`, status: `todo`
- Full details editable in TaskDetail drawer after creation

### Pomodoro / Focus Mode
- Activated by clicking "Start Focus" on any task
- 25 min work / 5 min break (configurable in settings)
- While active: UI dims to a fullscreen overlay showing only the active task
- On session complete: increment `task.pomodoroSessions`, prompt for break
- Timer state persisted so page reload restores mid-session

### Recurring Tasks
- Set on any task
- Auto-generates a new task instance each morning based on recurrence rule
- Completed instances are archived; the recurring template persists

### Progress Dashboard (`/review`)
- Tasks completed today / this week
- Total focus time (Pomodoro sessions × 25 min)
- Completion streak (days in a row with ≥1 task done)
- Weekly heatmap
- Breakdown by project

---

## UX Principles

1. **Capture first, sort later.** Quick capture is one keypress away, always. No required fields beyond title.
2. **The timeline is the truth.** Encourage scheduling but never force it. Unscheduled tasks are valid.
3. **Focus mode is sacred.** While a Pomodoro runs, no distractions — just the active task.
4. **No overdue guilt.** Unfinished tasks silently roll to tomorrow. No red badges, no shame.
5. **One task, four views.** Changing a task in any view updates it everywhere immediately via Zustand.

---

## Build Order

Work in this sequence. Do not skip ahead.

1. Zustand stores — `tasks.ts`, `projects.ts`, `ui.ts`
2. `QuickCapture` + `ListView` — usable MVP
3. `TaskDetail` drawer — full edit
4. `MatrixView` — triage layer
5. `PomodoroOverlay` — self-contained, high value
6. `TimelineView` — most complex (dnd-kit)
7. `KanbanView` — straightforward once status exists
8. `/review` dashboard — last, needs real data

---

## Code Conventions

- All components in `PascalCase`, all utilities in `camelCase`
- No `any` types — use proper TypeScript throughout
- Zustand slices should expose actions alongside state (not in separate files)
- Tailwind only — no inline styles, no CSS modules
- Prefer server components by default; add `'use client'` only when needed (interactivity, hooks, stores)
- All dates stored as ISO strings; format for display with `date-fns`

---

## Out of Scope (for now)

- Subtasks / nested tasks
- Authentication / multi-user
- Cloud sync / database (use localStorage)
- Mobile app
- Collaboration / shared projects
- AI features
- Third-party calendar sync
