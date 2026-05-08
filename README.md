# Focus

A daily time management app built with Next.js and Supabase. Capture tasks, prioritize them across four views, schedule your day on a timeline, and stay in flow with a built-in Pomodoro timer — synced in real time across all your devices.

---

## Features

### Four Views, One Data Model
All views share the same task store — changes in one reflect instantly everywhere.

- **List** — flat list sorted by Eisenhower priority (Q1 → Q2 → Q3 → Q4), filterable by project and tag
- **Matrix** — 2×2 Eisenhower grid; drag cards between quadrants to update urgency and importance
- **Timeline** — hour-by-hour daily schedule; drag unscheduled tasks into time slots
- **Kanban** — To Do / In Progress / Done columns; drag to update status

### Quick Capture
Press `/` or `N` from anywhere to focus the capture bar. Title is the only required field — everything else is optional and editable later.

### Task Detail Drawer
Click any task to open a full edit panel: title, notes, project, urgency/importance, status, scheduled date/time, duration, recurrence, and tags. Single Save button with visual feedback.

### Pomodoro / Focus Mode
Start a 25-minute focus session from any task. A fullscreen overlay shows only the active task and counts down. On completion, the session count increments and a break timer starts automatically. Timer state survives page reloads.

### Recurring Tasks
Tasks can recur daily, weekly, on weekdays, or on custom days of the week. Completing a recurring task immediately spawns the next instance for the next occurrence date.

### All Tasks View
Browse every task grouped by scheduled date — past, today (highlighted), and future — with an unscheduled section at the bottom. Real-time search across title, notes, and tags.

### Review Dashboard
Weekly stats: tasks completed today and this week, total focus time, completion streak, 7-day bar chart, and a breakdown by project.

### Real-time Sync
Changes on one device or tab appear instantly on all others via Supabase Realtime. A live indicator dot in the sidebar shows connection status.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| State | Zustand (in-memory, optimistic updates) |
| Backend | Supabase (Postgres + Auth + Realtime) |
| Animations | Framer Motion |
| Drag and Drop | dnd-kit |
| Validation | Yup |
| Charts | Recharts |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Clone and install

```bash
git clone <repo-url>
cd time-management
npm install
```

### 2. Environment variables

Create `.env.local` at the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database setup

Run the three migration files in order in the Supabase SQL editor:

```
supabase/migrations/001_initial_schema.sql   — tables, indexes, RLS policies
supabase/migrations/002_enable_realtime.sql  — add tables to realtime publication
supabase/migrations/003_replica_identity_full.sql — enable UPDATE/DELETE realtime events
```

### 4. Supabase Auth URL configuration

In the Supabase dashboard → Authentication → URL Configuration:
- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: `http://localhost:3000/**`

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, and start capturing tasks.

---

## Project Structure

```
app/
  (app)/
    (today)/page.tsx    # Today — List, Matrix, Timeline, Kanban tabs
    history/page.tsx    # All Tasks grouped by date
    review/page.tsx     # Weekly dashboard
    settings/page.tsx   # Preferences
  login/page.tsx
  signup/page.tsx
  reset-password/page.tsx

components/
  views/
    ListView.tsx
    matrix/             # MatrixView, Quadrant, MiniCard
    timeline/           # TimelineView, TimeGrid, TimeBlock, UnscheduledPanel
    kanban/             # KanbanView, KanbanColumn, KanbanCard
  task/
    TaskCard.tsx        # Shared card used across all views
    TaskDetail.tsx      # Full edit drawer
    QuickCapture.tsx    # Always-visible input bar
  pomodoro/
    PomodoroOverlay.tsx
  layout/
    Sidebar.tsx
    ViewSwitcher.tsx
    AppLoader.tsx       # Fetches data + wires Realtime subscriptions on mount

store/
  tasks.ts             # Optimistic CRUD, Supabase sync in background
  projects.ts          # Optimistic CRUD, Supabase sync in background
  ui.ts                # Active view, selected task, Pomodoro state, theme

lib/
  supabase/
    client.ts          # Browser Supabase client
    server.ts          # Server Supabase client
    mappers.ts         # DB snake_case ↔ app camelCase
  realtime.ts          # Supabase Realtime channel subscriptions
  recurrence.ts        # Next occurrence date calculation
  utils.ts
  constants.ts

supabase/migrations/   # SQL migrations — run in Supabase SQL editor
proxy.ts               # Session refresh + route protection (Next.js middleware)
```

---

## Architecture

**Optimistic updates** — writes hit local Zustand state immediately, then sync to Supabase in the background. The UI never waits for the network.

**Real-time sync** — Supabase Realtime pushes INSERT/UPDATE/DELETE events to all connected clients. Subscriptions are filtered by `user_id` and tables use `REPLICA IDENTITY FULL` so all event types work through the filter.

**No localStorage for data** — tasks and projects live only in Supabase. UI preferences (theme, Pomodoro durations, timeline hours) are persisted locally via Zustand `persist`.

**Row Level Security** — every row defaults to `auth.uid()` as the owner. Users can only read and write their own data.

---

## Deployment

See [Part 18 in docs/plan.md](docs/plan.md) for the full Vercel deployment checklist, including Supabase Auth URL configuration for production.
