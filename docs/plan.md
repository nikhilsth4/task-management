## Phase 0: Strategy Sync

Before writing any code, Claude outputs:

- Proposed component structure and file locations
- Props and TypeScript types
- State ownership (what lives where)
- Data flow between components
- Edge cases to handle

**Gate:** Wait for "LGTM" before writing any code. If the plan needs correction, revise and re-present.

---

## Part 1: Planning & Documentation

### Substeps:
- [x] 1.1 Enrich this document with detailed substeps and tests
- [x] 1.2 Get user approval on the plan

### Tests & Success Criteria:
- [x] Plan document contains checklist for all 10 parts
- [x] Each part has specific substeps with checkboxes
- [x] Each part has test requirements and success criteria defined
- [x] User approves the plan

---

## Part 2: Project Scaffold & Zustand Stores

### Substeps:
- [x] 2.1 Scaffold project with `create-next-app@latest`
- [x] 2.2 Install dependencies: `zustand`, `framer-motion`, `@dnd-kit/core`, `@dnd-kit/sortable`, `date-fns`
- [x] 2.3 Create `store/tasks.ts` — Task CRUD + selectors
- [x] 2.4 Create `store/projects.ts` — Project CRUD + selectors
- [x] 2.5 Create `store/ui.ts` — active view, selected task ID, pomodoro state
- [x] 2.6 Wire localStorage persistence via Zustand `persist` middleware
- [x] 2.7 Create `lib/utils.ts` and `lib/constants.ts`

### Files:
`store/tasks.ts`, `store/projects.ts`, `store/ui.ts`, `lib/utils.ts`, `lib/constants.ts`

### Tests & Success Criteria (Tier 1 + 2):
- [x] Adding a task persists to localStorage and survives page refresh
- [x] Updating a task field updates all subscribers immediately
- [x] Deleting a task removes it from the store
- [x] Project store CRUD works independently of task store
- [ ] UI store tracks active view and selected task without side effects — partial, full verification in Parts 5/7/8

> Note: localStorage persistence and subscriber tests are verified in Part 3 once the UI is wired up.

---

## Part 3: QuickCapture + ListView

### Substeps:
- [x] 3.1 Create `components/layout/ViewSwitcher.tsx` — tab bar for Matrix | List | Timeline | Kanban
- [x] 3.2 Create `components/layout/Sidebar.tsx` — project list + nav links
- [x] 3.3 Create `components/task/QuickCapture.tsx` — always-visible input bar
- [x] 3.4 Wire `/` and `N` global hotkeys to focus QuickCapture
- [x] 3.5 Create `components/task/TaskCard.tsx` — shared card (title, urgency badge, project color)
- [x] 3.6 Create `components/views/ListView.tsx` — sorted flat list, filter bar
- [x] 3.7 Connect `app/(today)/page.tsx` to render ListView with ViewSwitcher

### Files:
`app/(today)/page.tsx`, `components/layout/ViewSwitcher.tsx`, `components/layout/Sidebar.tsx`, `components/task/QuickCapture.tsx`, `components/task/TaskCard.tsx`, `components/views/ListView.tsx`

### Tests & Success Criteria (Tier 1 + 2):
- [x] Pressing `/` or `N` focuses QuickCapture from anywhere on the page
- [x] Submitting QuickCapture creates a task with `urgency: low`, `importance: low`, `status: todo`
- [x] New task appears immediately in ListView without page reload
- [x] ListView sorts by Q1 → Q2 → Q3 → Q4 priority correctly
- [x] Filter by project narrows the list correctly

---

## Part 4: TaskDetail Drawer

### Substeps:
- [x] 4.1 Create `components/task/TaskDetail.tsx` — slide-in drawer triggered by clicking a TaskCard
- [x] 4.2 Fields: title, notes, urgency, importance, status, scheduledDate, scheduledTime, duration, recurrence, tags, projectId
- [x] 4.3 Wire drawer open/close to `ui.ts` selected task state
- [x] 4.4 Changes save on blur/change (no explicit save button needed)
- [x] 4.5 "Start Focus" button in drawer triggers Pomodoro (wired in Part 6)

### Files:
`components/task/TaskDetail.tsx`

### Tests & Success Criteria (Tier 1 + 2):
- [x] Clicking a TaskCard opens the drawer with the correct task data
- [x] Editing the title updates the task in the store and reflects in ListView immediately
- [x] Closing and reopening the drawer shows persisted changes
- [x] Tag input adds and removes tags correctly

---

## Part 5: MatrixView

### Substeps:
- [x] 5.1 Create `components/views/MatrixView.tsx` — 2×2 Eisenhower grid
- [x] 5.2 Render tasks in the correct quadrant based on `urgency` + `importance`
- [x] 5.3 Implement drag-and-drop between quadrants using dnd-kit
- [x] 5.4 On drop, update `urgency` and `importance` in the task store

### Files:
`components/views/MatrixView.tsx`

### Tests & Success Criteria (Tier 1 + 2):
- [x] All four quadrants render with correct task placement
- [x] Dragging a card to a new quadrant updates `urgency` and `importance` in the store
- [x] The change reflects in ListView and TaskDetail immediately

---

## Part 6: PomodoroOverlay

### Substeps:
- [x] 6.1 Create `components/pomodoro/PomodoroOverlay.tsx` — fullscreen overlay
- [x] 6.2 Timer: 25 min work / 5 min break (configurable via ui.ts settings)
- [x] 6.3 Display active task title during focus session
- [x] 6.4 On session complete: increment `task.pomodoroSessions`, prompt break
- [x] 6.5 While active: dim the rest of the UI (pointer-events-none overlay)
- [x] 6.6 Wire "Start Focus" in TaskDetail and TaskCard to activate overlay
- [x] 6.7 Allow early session end with confirmation prompt

### Files:
`components/pomodoro/PomodoroOverlay.tsx`, `store/ui.ts` (pomodoro state)

### Tests & Success Criteria (Tier 1 + 2):
- [x] Clicking "Start Focus" on a task opens the overlay and starts the timer
- [x] Timer counts down correctly; completes at 0:00
- [x] On completion, `task.pomodoroSessions` increments by 1 in the store
- [x] Break timer starts after work session completes
- [x] Ending a session early via confirmation does not increment the session count
- [x] The rest of the UI is non-interactive while overlay is active
- [x] Refreshing mid-session restores the overlay with the correct remaining time (pomodoro state persisted via Zustand `persist`)

---

## Part 7: TimelineView

### Conflict Handling Decision:
Overlapping tasks (same time slot) are **stacked side by side** within the time column — no blocking, no silent overlap. This mirrors Google Calendar behavior: the conflict is visible but the user is never prevented from scheduling. Width of each block shrinks proportionally to fit all overlapping tasks in the column.

### Substeps:
- [x] 7.1 Create `components/views/timeline/TimelineView.tsx` — hour-by-hour grid (06:00–22:00 default)
- [x] 7.2 Render scheduled tasks as blocks sized by `duration`
- [x] 7.3 Create unscheduled tasks side panel (`UnscheduledPanel.tsx`)
- [x] 7.4 Implement drag-and-drop from side panel to time slot using dnd-kit
- [x] 7.5 On drop, set `scheduledDate` and `scheduledTime` on the task
- [x] 7.6 Implement drag to reschedule already-placed blocks
- [x] 7.7 Detect overlapping tasks and render them side by side
- [x] 7.8 Drag scheduled blocks back to unscheduled panel to clear schedule
- [x] 7.9 Date navigation: prev/next arrows + click-to-open native calendar picker

### Files:
`components/views/timeline/TimelineView.tsx`, `components/views/timeline/TimeGrid.tsx`, `components/views/timeline/TimeBlock.tsx`, `components/views/timeline/UnscheduledPanel.tsx`

### Tests & Success Criteria (Tier 1 + 2):
- [x] Scheduled tasks appear in the correct time slot
- [x] Block height corresponds to `duration` in minutes
- [x] Dragging from unscheduled panel to a slot sets `scheduledDate` and `scheduledTime`
- [x] Only tasks without `scheduledDate` appear in the unscheduled panel
- [x] Dragging a placed block to a new slot updates the time correctly
- [x] Two tasks scheduled at the same time render side by side at half-width
- [x] Three overlapping tasks each render at one-third width

---

## Part 8: KanbanView

### Substeps:
- [x] 8.1 Create `components/views/kanban/KanbanView.tsx` — three columns: To Do / In Progress / Done
- [x] 8.2 Render tasks as cards color-coded by `project.color`
- [x] 8.3 Implement drag-and-drop between columns using dnd-kit
- [x] 8.4 On drop, update `status` in the task store
- [x] 8.5 Add Mark Done / Reopen button to TaskDetail drawer
- [x] 8.6 Delete project cascades to all its tasks

### Files:
`components/views/kanban/KanbanView.tsx`, `components/views/kanban/KanbanColumn.tsx`, `components/views/kanban/KanbanCard.tsx`, `components/task/TaskDetail.tsx`, `store/tasks.ts`, `components/layout/Sidebar.tsx`

### Tests & Success Criteria (Tier 1 + 2):
- [x] Tasks appear in the correct column based on `status`
- [x] Dragging a card to a new column updates `status` in the store
- [x] Change reflects in ListView and TaskDetail immediately
- [x] Cards are color-coded by their project color
- [x] Deleting a project removes all its tasks

---

## Part 9: Review Dashboard

### Substeps:
- [x] 9.1 Create `app/review/page.tsx` — weekly progress dashboard
- [x] 9.2 Compute: tasks completed today, tasks completed this week
- [x] 9.3 Compute: total focus time (pomodoroSessions × 25 min)
- [x] 9.4 Compute: completion streak (days in a row with ≥1 task done)
- [x] 9.5 Render 7-day BarChart (Recharts) with today highlighted
- [x] 9.6 Render breakdown by project — horizontal BarChart (Recharts)
- [x] 9.7 Stat cards with sparkline + ↑/↓ trend vs last week

### Files:
`app/review/page.tsx`

### Tests & Success Criteria (Tier 1 + 2):
- [x] Today's completed task count matches tasks with `completedAt` today
- [x] Weekly count matches tasks completed in the last 7 days
- [x] Focus time correctly sums `pomodoroSessions × 25` across all tasks
- [x] Streak resets when a day has zero completed tasks
- [x] Project breakdown matches tasks filtered by `projectId`

---

## Part 10: Settings & Polish

### Substeps:
- [x] 10.1 Create `app/settings/page.tsx` — preferences panel
- [x] 10.2 Settings: timeline start/end hour, Pomodoro work/break duration
- [ ] 10.3 Implement recurring task generation — moved to Part 11
- [x] 10.4 Add Framer Motion transitions: drawer slide-in/out, view switching fade
- [ ] 10.5 Final accessibility pass: keyboard navigation, focus traps in drawer/overlay
- [x] 10.6 Verify no console errors, no TypeScript errors (`tsc --noEmit`)
- [ ] 10.7 Deploy to Vercel

### Files:
`app/settings/page.tsx`, `store/ui.ts`, `components/task/TaskDetail.tsx`, `app/(today)/page.tsx`

### Tests & Success Criteria (Tier 1 + 2):
- [x] Changing timeline hours in settings reflects in TimelineView immediately
- [x] Changing Pomodoro durations in settings takes effect on the next session
- [x] `tsc --noEmit` passes with zero errors

---

## Part 11: Recurring Tasks & History

### Recurring Task Design:
Completing a recurring task immediately spawns the next instance scheduled for the next occurrence date. No on-load generation — completion is the trigger. Instances have `recurrence: none` so they don't chain further.

### Substeps:
- [x] 11.1 Add `customDays: number[]` to Task model (0=Sun … 6=Sat)
- [x] 11.2 Add day-picker UI in TaskDetail — shown when `recurrence === 'custom'`
- [x] 11.3 Create `lib/recurrence.ts` — `nextOccurrenceDate` + `buildInstance` logic
- [x] 11.4 `completeTask` in store spawns next instance if task has recurrence set
- [x] 11.5 Instances scheduled for next occurrence date with `recurrence: none`
- [x] 11.6 Unfinished scheduled tasks roll over to today on app load (status reset to todo)
- [x] 11.7 All views filter to today + unscheduled tasks only
- [x] 11.8 Add `/history` page — completed tasks grouped by date, newest first
- [x] 11.9 Add Completed nav link to Sidebar

### Files:
`store/tasks.ts`, `lib/recurrence.ts`, `components/task/TaskDetail.tsx`, `app/(today)/page.tsx`, `app/history/page.tsx`, `components/layout/Sidebar.tsx`

### Tests & Success Criteria (Tier 1 + 2):
- [x] Completing a daily task creates a new instance for tomorrow
- [x] Completing a weekday task skips to next weekday
- [x] Completing a weekly task schedules next instance 7 days later (same weekday)
- [x] Completing a custom task schedules next instance on the next selected day
- [x] New instance has recurrence: none — does not chain further
- [x] Unfinished past tasks roll to today with status reset to todo
- [x] Views show only today + unscheduled tasks
- [x] Completed page groups tasks by date with completion time shown

---

## Part 12: Design System Redesign + Dark/Light Mode

### Design Reference: `docs/DESIGN.md`
The app is visually redesigned to follow the Cohere-inspired system documented in DESIGN.md. White canvas main area, near-black sidebar, soft stone card surfaces, coral accent chips, pill-shaped primary buttons, flat elevation with thin borders. Dark mode uses deep green-black surfaces. All inline styles are replaced with Tailwind utility classes.

### Color Tokens (from DESIGN.md):
| Role | Light | Dark |
|---|---|---|
| Page background | `#ffffff` (canvas white) | `#071829` (dark navy) |
| Card surface | `#eeece7` (soft stone) | `#0d1f2d` |
| Card border | `#f2f2f2` | `#1a2e3f` |
| Rule / divider | `#d9d9dd` | `#1e3040` |
| Primary text | `#212121` (ink) | `#f0f0f0` |
| Secondary text | `#93939f` (muted slate) | `#6b7f8f` |
| Sidebar background | `#17171c` (near-black) | `#0a0a0f` |
| Sidebar active item | `#2a2a32` | `#141420` |
| Accent / badge | `#ff7759` (coral) | `#ff7759` |
| Link / active blue | `#1863dc` (action blue) | `#4c87e8` |
| Focus ring | `#4c6ee6` | `#4c6ee6` |

### Typography (from DESIGN.md — using available fallbacks):
- **Display / headings**: `Space Grotesk`, falling back to `Inter`, `ui-sans-serif`
- **Body / UI**: `Inter`, falling back to `ui-sans-serif`, `system-ui`
- **Mono labels**: `JetBrains Mono`, falling back to `ui-monospace`
- Load via `next/font/google` in `app/layout.tsx`

### Shape Scale (from DESIGN.md):
- `rounded` (4px) — inputs, small utility elements
- `rounded-lg` (8px) — task cards, chips, small media
- `rounded-2xl` (16px) — drawers, panels, modals
- `rounded-[22px]` — major surface cards (timeline blocks, kanban cards)
- `rounded-full` (pill) — primary CTA buttons, status badges

### Component Translations:
| DESIGN.md component | App equivalent |
|---|---|
| `button-primary` (pill, near-black) | "Start Focus", "Add task", primary actions |
| `button-secondary` (text link) | Cancel, secondary drawer actions |
| `button-pill-outline` (outlined pill) | View switcher tabs, filter chips |
| `research-table` (rule-separated rows) | ListView task rows |
| `agent-console-card` (dark panel) | PomodoroOverlay, dark sidebar |
| `blog-filter-chip` (coral chip) | Urgency/quadrant badges |
| `product-card` (stone card) | TaskCard, KanbanCard |
| `dark-feature-band` (deep green/navy) | Dark mode surface color |

### Tailwind Dark Mode Setup:
```css
/* globals.css */
@import "tailwindcss";
@variant dark (&:where(.dark, .dark *));
```
`dark` class toggled on `<html>` by Zustand theme state.

### Substeps:
- [x] 12.1 Install `Space Grotesk` and `JetBrains Mono` via `next/font/google`; configure `@theme` in `globals.css` with full color + font tokens; set up `@variant dark`
- [x] 12.2 Add `theme: 'light' | 'dark' | 'system'` to `store/ui.ts`; sync `dark` class on `<html>` via `ThemeSync` component; honor `prefers-color-scheme` as default
- [x] 12.3 Redesign `Sidebar.tsx` — near-black bg, Space Grotesk wordmark, nav links, coral dot for active project, sun/monitor/moon theme toggle in footer
- [x] 12.4 Redesign `TaskCard.tsx` — stone surface, hairline border, WCAG badge tokens, hover lift
- [x] 12.5 Redesign `TaskDetail.tsx` — canvas/stone panel, CSS var actions, blue Focus button, outlined secondary actions
- [x] 12.6 Redesign `QuickCapture.tsx` — canvas input bar, hairline border, pill Add button
- [x] 12.7 Redesign `ViewSwitcher.tsx` — ink underline for active tab, slate for inactive
- [x] 12.8 Redesign `ListView.tsx` — stone filter dropdowns, CSS var empty state
- [x] 12.9 Redesign `MatrixView.tsx` + `Quadrant.tsx` + `MiniCard.tsx` — canvas/stone surfaces, badge token pairs
- [x] 12.10 Redesign Timeline files — stone blocks, hairline grid, badge-q2 drop highlight, Tailwind nav buttons
- [x] 12.11 Redesign Kanban files — stone cards, canvas columns, CSS var column accents
- [x] 12.12 Redesign `PomodoroOverlay.tsx` — always-dark full-screen, mode color indicator
- [x] 12.13 Redesign `app/review/page.tsx` — canvas bg, stone stat/chart cards, CSS var chart axes
- [x] 12.14 Redesign `app/history/page.tsx` and `app/settings/page.tsx` — CSS var rows, controls, section headers
- [x] 12.15 All theme-sensitive colors use CSS variables; project accent COLOR_MAP and semantic colors (error red, success green) remain as fixed values

### Files:
`app/globals.css`, `app/layout.tsx`, `store/ui.ts`, `components/layout/Sidebar.tsx`, `components/layout/ThemeSync.tsx`, `components/layout/ViewSwitcher.tsx`, `components/task/TaskCard.tsx`, `components/task/TaskDetail.tsx`, `components/task/QuickCapture.tsx`, `components/views/ListView.tsx`, `components/views/matrix/MatrixView.tsx`, `components/views/matrix/Quadrant.tsx`, `components/views/matrix/MiniCard.tsx`, `components/views/timeline/TimelineView.tsx`, `components/views/timeline/TimeGrid.tsx`, `components/views/timeline/TimeBlock.tsx`, `components/views/timeline/UnscheduledPanel.tsx`, `components/views/kanban/KanbanView.tsx`, `components/views/kanban/KanbanColumn.tsx`, `components/views/kanban/KanbanCard.tsx`, `components/pomodoro/PomodoroOverlay.tsx`, `app/review/page.tsx`, `app/history/page.tsx`, `app/settings/page.tsx`

### Tests & Success Criteria (Tier 1 + 2):
- [x] Theme toggle switches light ↔ dark; preference survives page reload
- [x] `prefers-color-scheme: dark` users get dark mode on first visit (system default)
- [x] All theme-sensitive colors use CSS variable tokens
- [x] WCAG AA contrast met for quadrant badge pairs in both themes
- [x] Space Grotesk renders for display elements; Geist Sans for body
- [x] Recharts chart axes and tooltips use CSS var colors in both themes
- [x] `tsc --noEmit` passes with zero errors

---

## Part 13: Mobile Responsive

### Responsive Strategy:
Three breakpoints using Tailwind's built-in prefixes — `sm:` (≥640px), `md:` (≥768px), `lg:` (≥1024px). Since all components will be converted to Tailwind classes in Part 12, responsive variants are added in the same pass or as a follow-up. Sidebar becomes a slide-in drawer on mobile with a hamburger trigger. All touch targets are ≥44px (`min-h-11 min-w-11`).

### Breakpoints:
| Name | Width | Sidebar behavior |
|---|---|---|
| Mobile | < 640px | Hidden; hamburger → full-width drawer overlay |
| Tablet | 640–1024px | Icon-only collapsed sidebar (48px wide) |
| Desktop | > 1024px | Full sidebar (200px) — current behavior |

### Substeps:
- [x] 13.1 Verify Tailwind breakpoint prefixes (`sm:`, `md:`, `lg:`) work correctly in the build; add any custom breakpoints to `globals.css` `@theme` if needed
- [x] 13.2 Refactor `Sidebar.tsx` — add hamburger button + mobile drawer overlay; icon-only mode at tablet
- [x] 13.3 Make `app/layout.tsx` root flex layout respond to sidebar state on mobile
- [x] 13.4 Make `ViewSwitcher.tsx` scroll horizontally on mobile (overflow-x: auto, no wrap)
- [x] 13.5 Make `QuickCapture.tsx` full-width on all breakpoints
- [x] 13.6 Make `ListView.tsx` task cards responsive grid (1→2→3→4 cols) + search box
- [x] 13.7 `MatrixView.tsx` — 2×2 grid stacks to 1×4 on mobile (vertical scroll)
- [x] 13.8 `TimelineView.tsx` — unscheduled panel toggle button on mobile
- [x] 13.9 `KanbanView.tsx` — columns scroll horizontally on mobile (snap scroll)
- [x] 13.10 `TaskDetail.tsx` drawer goes full-screen on mobile
- [x] 13.11 `PomodoroOverlay.tsx` — timer font scales down on mobile, task title wraps
- [x] 13.12 Review and Settings pages reflow to single column on mobile

### Files:
`app/globals.css`, `app/layout.tsx`, `components/layout/Sidebar.tsx`, `components/layout/ViewSwitcher.tsx`, `components/layout/MobileHeader.tsx`, `components/task/QuickCapture.tsx`, `components/task/TaskDetail.tsx`, `components/views/ListView.tsx`, `components/views/matrix/MatrixView.tsx`, `components/views/timeline/TimelineView.tsx`, `components/views/kanban/KanbanView.tsx`, `components/views/kanban/KanbanColumn.tsx`, `components/pomodoro/PomodoroOverlay.tsx`, `app/review/page.tsx`, `store/ui.ts`

### Tests & Success Criteria (Tier 1 + 2):
- [x] At 375px width: sidebar hidden, hamburger visible, drawer opens/closes
- [x] At 768px width: icon-only sidebar visible, tooltips on hover
- [x] ViewSwitcher tabs never wrap or overflow at any width
- [x] TaskDetail opens full-screen on mobile, slide-in drawer on desktop
- [x] Kanban columns horizontally scrollable on mobile with snap behavior
- [x] Matrix stacks to vertical list on mobile
- [x] No horizontal page overflow at any breakpoint


---

## Part 14: Supabase Setup + Database + Store Refactor

### Phase 0 Required: Yes

### Context
localStorage is removed entirely. Supabase is the single source of truth from day one. Zustand stores become async in-memory caches — no `persist` middleware. Every user owns their own data enforced via Row Level Security.

### Substeps

#### Supabase Project
- [ ] 14.1 Create Supabase project at supabase.com
- [ ] 14.2 Add environment variables to `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  ```
- [ ] 14.3 Add `.env.local` to `.gitignore`
- [ ] 14.4 Install `@supabase/supabase-js` and `@supabase/ssr`

#### Supabase Client
- [ ] 14.5 Create `lib/supabase/client.ts` — browser client (uses anon key)
- [ ] 14.6 Create `lib/supabase/server.ts` — server client (uses service role, for Route Handlers)
- [ ] 14.7 Create `lib/supabase/middleware.ts` — session refresh helper

#### Database Schema
- [ ] 14.8 Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- Projects
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  color text not null,
  created_at timestamptz default now() not null
);

-- Tasks
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references projects(id) on delete set null,
  parent_id uuid references tasks(id) on delete cascade,

  title text not null,
  notes text default '' not null,

  urgency text check (urgency in ('high', 'low')) default 'low' not null,
  importance text check (importance in ('high', 'low')) default 'low' not null,
  status text check (status in ('todo', 'in_progress', 'done')) default 'todo' not null,

  scheduled_date date,
  scheduled_time time,
  duration integer,

  recurrence text check (recurrence in ('none', 'daily', 'weekly', 'weekdays', 'custom')) default 'none' not null,
  custom_days integer[] default '{}',

  pomodoro_sessions integer default 0 not null,
  tags text[] default '{}',

  created_at timestamptz default now() not null,
  completed_at timestamptz
);

-- Indexes
create index tasks_user_id_idx on tasks(user_id);
create index tasks_parent_id_idx on tasks(parent_id);
create index tasks_project_id_idx on tasks(project_id);
create index tasks_scheduled_date_idx on tasks(scheduled_date);
```

- [ ] 14.9 Run migration in Supabase SQL editor
- [ ] 14.10 Enable Row Level Security on both tables:

```sql
-- RLS on projects
alter table projects enable row level security;

create policy "Users can manage their own projects"
  on projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS on tasks
alter table tasks enable row level security;

create policy "Users can manage their own tasks"
  on tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

#### Zustand Store Refactor
- [ ] 14.11 Remove `persist` middleware from all three stores (`tasks.ts`, `projects.ts`, `ui.ts`)
- [ ] 14.12 Remove `lib/storage.ts` entirely
- [ ] 14.13 Refactor `store/tasks.ts` — all actions become async, call Supabase first, then update local state:
  - `loadTasks(userId)` — fetch all tasks for the user on login
  - `addTask(input)` — insert to Supabase, append to local state
  - `updateTask(id, patch)` — optimistic update local state, then sync to Supabase; rollback on error
  - `deleteTask(id)` — delete from Supabase (cascade handles subtasks), remove from local state
  - `toggleStatus(id)` — update status + completedAt, trigger recurrence if applicable
  - `addSubtask(parentId, title)` — insert with parentId + inherited projectId
- [ ] 14.14 Refactor `store/projects.ts` — same async pattern:
  - `loadProjects(userId)`
  - `addProject(title, color)`
  - `updateProject(id, patch)`
  - `deleteProject(id)` — Supabase cascade sets tasks.project_id to null
- [ ] 14.15 Add `loading: boolean` and `error: string | null` state to both stores
- [ ] 14.16 Remove all `window`/localStorage references from the codebase (`grep -r localStorage` should return nothing)

#### Type Sync
- [ ] 14.17 Generate Supabase TypeScript types: `npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts`
- [ ] 14.18 Map Supabase snake_case types to existing camelCase TypeScript interfaces in `lib/supabase/mappers.ts`

### Files Created / Modified
```
.env.local
lib/supabase/client.ts
lib/supabase/server.ts
lib/supabase/middleware.ts
lib/supabase/types.ts
lib/supabase/mappers.ts
supabase/migrations/001_initial_schema.sql
store/tasks.ts              (refactored)
store/projects.ts           (refactored)
store/ui.ts                 (persist removed)
lib/storage.ts              (deleted)
```

### Tests & Success Criteria (Tier 1 + 2)
- [ ] `grep -r localStorage src/` returns zero results
- [ ] Adding a task inserts a row in Supabase with correct `user_id`
- [ ] Updating a task reflects in Supabase within 1 second
- [ ] Deleting a project sets `project_id` to null on its tasks (not delete)
- [ ] Deleting a task cascades and removes its subtasks from Supabase
- [ ] `loading` state is true during async operations, false after
- [ ] On Supabase write error, optimistic update is rolled back and `error` is set
- [ ] `tsc --noEmit` passes with zero errors
- [ ] RLS verified: manually querying Supabase with a different user's JWT returns zero rows

---

## Part 15: Auth — Email/Password + Protected Routes

### Phase 0 Required: Yes

### Substeps

#### Auth UI
- [ ] 15.1 Create `app/(auth)/login/page.tsx` — sign in form (email + password)
- [ ] 15.2 Create `app/(auth)/signup/page.tsx` — sign up form (email + password + confirm password)
- [ ] 15.3 Create `app/(auth)/verify/page.tsx` — "check your email" confirmation screen
- [ ] 15.4 Create `app/(auth)/reset-password/page.tsx` — request password reset
- [ ] 15.5 Style all auth pages using the existing design system (canvas bg, stone card, pill buttons)
- [ ] 15.6 Add form validation — empty fields, password length ≥8, passwords match on signup

#### Auth Logic
- [ ] 15.7 Create `lib/auth.ts` — helpers: `signUp`, `signIn`, `signOut`, `resetPassword`
- [ ] 15.8 On `signUp` — Supabase sends verification email; redirect to `/verify`
- [ ] 15.9 On `signIn` — load tasks + projects into Zustand stores, redirect to `/`
- [ ] 15.10 On `signOut` — clear Zustand stores, redirect to `/login`

#### Session + Route Protection
- [ ] 15.11 Create `middleware.ts` at project root — refresh session cookie on every request
- [ ] 15.12 Protect all app routes — unauthenticated requests redirect to `/login`
- [ ] 15.13 Public routes (no auth required): `/login`, `/signup`, `/verify`, `/reset-password`
- [ ] 15.14 Add user session to `store/ui.ts`: `user: User | null`, `setUser`, `clearUser`

#### App Integration
- [ ] 15.15 In `app/layout.tsx` — check session server-side, pass user to client
- [ ] 15.16 Add user avatar + sign out button to `Sidebar.tsx` footer (replaces theme toggle position — keep both)
- [ ] 15.17 On first app load after sign in — call `loadTasks()` and `loadProjects()` with `user.id`

### Files Created / Modified
```
app/(auth)/login/page.tsx
app/(auth)/signup/page.tsx
app/(auth)/verify/page.tsx
app/(auth)/reset-password/page.tsx
lib/auth.ts
middleware.ts
store/ui.ts                 (user session added)
components/layout/Sidebar.tsx (sign out + avatar)
app/layout.tsx              (session check)
```

### Tests & Success Criteria (Tier 1 + 2)
- [ ] Signing up with valid credentials sends a verification email
- [ ] Signing in with correct credentials loads the app and shows tasks
- [ ] Signing in with wrong password shows an inline error (not a page crash)
- [ ] Visiting `/` while unauthenticated redirects to `/login`
- [ ] Visiting `/login` while authenticated redirects to `/`
- [ ] Signing out clears Zustand stores and redirects to `/login`
- [ ] Session persists across page reload (no re-login required)
- [ ] Two different users see only their own tasks — verified manually
- [ ] Password reset email is sent for a valid email address
- [ ] `tsc --noEmit` passes with zero errors

---

## Part 16: All Tasks View

### Substeps
- [x] 16.1 Replace Completed page with All Tasks page (`app/(app)/history/page.tsx`)
- [x] 16.2 Group tasks by scheduled date — past, today (highlighted blue), future
- [x] 16.3 Unscheduled tasks shown in separate section at bottom
- [x] 16.4 Search bar filters across title, notes, tags
- [x] 16.5 Each row shows title, project, scheduled time, status badge
- [x] 16.6 Completed tasks shown with strikethrough + reduced opacity
- [x] 16.7 Rename sidebar nav item from "Completed" to "All Tasks"

### Files
`app/(app)/history/page.tsx`, `components/layout/Sidebar.tsx`

### Tests & Success Criteria (Tier 1)
- [x] All tasks appear grouped by date with correct labels (Today, Tomorrow, Yesterday, full date)
- [x] Unscheduled tasks appear in their own section
- [x] Search filters tasks in real time
- [x] Clicking a task row opens TaskDetail drawer

---

## Part 17: Real-time Sync

### Phase 0 Required: Yes

### Context
Supabase Realtime pushes database changes to all connected clients. This means tasks updated on one device/tab appear instantly on another without polling. Combined with optimistic updates from Part 14, the UX feels instant on the local device while staying consistent across devices.

### Realtime Strategy
- Subscribe to `tasks` and `projects` tables filtered by `user_id`
- Events: `INSERT`, `UPDATE`, `DELETE`
- On event: patch Zustand store directly — no full reload
- Subscriptions created on sign-in, destroyed on sign-out

### Substeps
- [ ] 16.1 Create `lib/realtime.ts` — `subscribeToTasks(userId, store)` and `subscribeToProjects(userId, store)`
- [ ] 16.2 On `INSERT` event → append to store if not already present (guard against own optimistic insert)
- [ ] 16.3 On `UPDATE` event → patch matching task/project in store
- [ ] 16.4 On `DELETE` event → remove matching item from store
- [ ] 16.5 Wire subscriptions in `app/layout.tsx` — start on mount when user is present, cleanup on unmount
- [ ] 16.6 On sign-out — call `supabase.removeAllChannels()` to clean up subscriptions
- [ ] 16.7 Add connection status indicator to `Sidebar.tsx` footer — green dot (connected) / grey dot (reconnecting)

### Files Created / Modified
```
lib/realtime.ts
app/layout.tsx              (subscription wiring)
components/layout/Sidebar.tsx (connection indicator)
```

### Tests & Success Criteria (Tier 1 + 2)
- [ ] Adding a task in Tab A appears in Tab B within 1 second without reload
- [ ] Updating a task title in Tab A reflects in Tab B immediately
- [ ] Deleting a task in Tab A removes it from Tab B immediately
- [ ] No duplicate tasks appear from own optimistic inserts
- [ ] Subscriptions are cleaned up on sign-out (no memory leaks)
- [ ] Connection indicator shows grey while Supabase reconnects, green when live
- [ ] `tsc --noEmit` passes with zero errors