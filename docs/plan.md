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
- [ ] 7.1 Create `components/views/TimelineView.tsx` — hour-by-hour grid (06:00–22:00 default)
- [ ] 7.2 Render scheduled tasks as blocks sized by `duration`
- [ ] 7.3 Create unscheduled tasks side panel
- [ ] 7.4 Implement drag-and-drop from side panel to time slot using dnd-kit
- [ ] 7.5 On drop, set `scheduledDate` and `scheduledTime` on the task
- [ ] 7.6 Implement drag to reschedule already-placed blocks
- [ ] 7.7 Detect overlapping tasks and render them side by side

### Files:
`components/views/TimelineView.tsx`

### Tests & Success Criteria (Tier 1 + 2):
- [ ] Scheduled tasks appear in the correct time slot
- [ ] Block height corresponds to `duration` in minutes
- [ ] Dragging from unscheduled panel to a slot sets `scheduledDate` and `scheduledTime`
- [ ] Only tasks without `scheduledDate` appear in the unscheduled panel
- [ ] Dragging a placed block to a new slot updates the time correctly
- [ ] Two tasks scheduled at the same time render side by side at half-width
- [ ] Three overlapping tasks each render at one-third width

---

## Part 8: KanbanView

### Substeps:
- [ ] 8.1 Create `components/views/KanbanView.tsx` — three columns: To Do / In Progress / Done
- [ ] 8.2 Render tasks as cards color-coded by `project.color`
- [ ] 8.3 Implement drag-and-drop between columns using dnd-kit
- [ ] 8.4 On drop, update `status` in the task store

### Files:
`components/views/KanbanView.tsx`

### Tests & Success Criteria (Tier 1 + 2):
- [ ] Tasks appear in the correct column based on `status`
- [ ] Dragging a card to a new column updates `status` in the store
- [ ] Change reflects in ListView and TaskDetail immediately
- [ ] Cards are color-coded by their project color

---

## Part 9: Review Dashboard

### Substeps:
- [ ] 9.1 Create `app/review/page.tsx` — weekly progress dashboard
- [ ] 9.2 Compute: tasks completed today, tasks completed this week
- [ ] 9.3 Compute: total focus time (pomodoroSessions × 25 min)
- [ ] 9.4 Compute: completion streak (days in a row with ≥1 task done)
- [ ] 9.5 Render weekly heatmap (7-day grid, shade by completion count)
- [ ] 9.6 Render breakdown by project (task count + focus time per project)

### Files:
`app/review/page.tsx`

### Tests & Success Criteria (Tier 1 + 2):
- [ ] Today's completed task count matches tasks with `completedAt` today
- [ ] Weekly count matches tasks completed in the last 7 days
- [ ] Focus time correctly sums `pomodoroSessions × 25` across all tasks
- [ ] Streak resets when a day has zero completed tasks
- [ ] Heatmap shading reflects relative completion density
- [ ] Project breakdown matches tasks filtered by `projectId`

---

## Part 10: Settings & Polish

### Substeps:
- [ ] 10.1 Create `app/settings/page.tsx` — preferences panel
- [ ] 10.2 Settings: timeline start/end hour, Pomodoro work/break duration
- [ ] 10.3 Implement recurring task generation — auto-create next instance each morning
- [ ] 10.4 Add Framer Motion transitions: drawer open/close, view switching, card drag
- [ ] 10.5 Final accessibility pass: keyboard navigation, focus traps in drawer/overlay
- [ ] 10.6 Verify no console errors, no TypeScript errors (`tsc --noEmit`)
- [ ] 10.7 Deploy to Vercel

### Files:
`app/settings/page.tsx`, `store/ui.ts` (settings state), recurrence logic in `lib/utils.ts`

### Tests & Success Criteria (Tier 1 + 2):
- [ ] Changing timeline hours in settings reflects in TimelineView immediately
- [ ] Changing Pomodoro durations in settings takes effect on the next session
- [ ] A daily recurring task generates a new instance the next morning
- [ ] Completing a recurring instance archives it but does not delete the template
- [ ] `tsc --noEmit` passes with zero errors
- [ ] App deploys and loads correctly on Vercel with no runtime errors
