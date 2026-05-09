---

## Part 20: Project Page + AI Task Manager

### Phase 0 Required: Yes

### Context
Each project gets a dedicated page at `/projects/[id]`. Two sections: task list on top (all project tasks visible at a glance), AI chat at the bottom. You describe what's happening in plain language — AI reads the full task list, acts immediately on the store, and tells you what it did. No tabs, no confirmation step, no forms. Session-only conversation history — resets on page leave.

### Page Layout
```
/projects/[id]
┌─────────────────────────────────┐
│  Website Redesign               │
│  5 tasks · 2 done               │
├─────────────────────────────────┤
│                                 │
│  ✓ Set up repo                  │
│  ✓ Design mockups               │
│  ● API integration    [urgent]  │
│  ○ Write landing page copy      │
│  ○ Deploy to Vercel             │
│                        + Add    │
│                                 │
├─────────────────────────────────┤
│  AI: Marked "Set up repo" and   │
│  "Design mockups" as done.      │
│  Moved API integration to       │
│  urgent.                        │
│                                 │
│  You: finished design, API is   │
│  taking longer                  │
│─────────────────────────────────│
│  [what's happening......]  Send │
└─────────────────────────────────┘
```

### AI Capabilities
The AI can perform any of these actions from a single message:

| What you say | What AI does |
|---|---|
| "create a task for X" | Creates new task in this project |
| "mark X as done" | Sets status to `done`, sets `completedAt` |
| "I finished X" | Same as above |
| "make X urgent" | Sets `urgency: high`, `importance: high` |
| "X is taking longer, push to Friday" | Updates `scheduledDate` |
| "add a task for X due Monday at 2pm" | Creates task with date + time |
| "I'm working on X now" | Sets status to `in_progress` |
| "remove the X task" | Deletes the task |
| "what should I work on next?" | Reasons over tasks, replies with suggestion (no action) |

### Action Schema
```ts
type ChatAction =
  | { type: 'create_task'; payload: { title: string; urgency: Urgency; importance: Importance; scheduledDate?: string; scheduledTime?: string; duration?: number; tags?: string[] } }
  | { type: 'update_task'; payload: { id: string; patch: Partial<Task> } }
  | { type: 'delete_task'; payload: { id: string } }
  | { type: 'complete_task'; payload: { id: string } }

type ChatResponse = {
  message: string
  actions?: ChatAction[]
}
```

### Substeps

#### Route
- [x] 21.1 Create `app/api/ai/project-chat/route.ts` — POST endpoint
  - Accepts `{ messages: { role: 'user' | 'assistant', content: string }[], projectTitle: string, tasks: { id, title, status, urgency, importance, scheduledDate }[] }`
  - Returns `{ message: string, actions?: ChatAction[] }`
  - Full Zod validation on both action schema and response shape
  - System prompt includes full task list + action schema instructions
  - Strips markdown fences before JSON parse
  - Falls back to `{ message: rawText, actions: [] }` if JSON parse fails
- [x] 21.1a Today's date injected into system prompt so AI resolves relative dates ("tomorrow", "yesterday", "next Friday") to ISO strings
- [x] 21.1b Prompt explicitly instructs AI to create separate `create_task` actions for each item when request implies multiple tasks (e.g. "one per professor")
- [x] 21.1c Prompt instructs AI to set `scheduledDate` (YYYY-MM-DD) and `scheduledTime` (HH:MM 24h) fields — never embed dates/times in task titles
- [x] 21.1d Recurrence detection from natural language: "daily" / "every Monday" / "weekdays" / "every Mon and Thu" → `recurrence` + `customDays` (0=Sun..6=Sat) on the create_task and update_task payloads

#### Project Page
- [x] 21.2 Create `app/(app)/projects/[id]/page.tsx` — project page shell
  - Reads `projectId` via `React.use(params)` (Next.js 16 / React 19 pattern)
  - Reads project + task counts from Zustand store
  - Redirects to `/` if project not found
  - Two sections: TaskList (top, flex-1 scrollable) + ChatSection (bottom, fixed 320px)
  - Renders `<TaskDetail />` drawer so clicking task rows opens the drawer
- [x] 21.3 Update `Sidebar.tsx` — project items navigate to `/projects/[id]`
  - Removed filter-on-click behaviour from project items
  - Each project item is now a `<Link>` — full click navigates to project page
  - `→` arrow icon appears on hover as visual nav affordance
  - Active state derived from `usePathname()` matching `/projects/[id]`
  - Delete `×` button preserved on hover with `e.preventDefault()` to avoid navigation

#### Task List Section
- [x] 21.4 Create `components/project/ProjectTaskList.tsx`
  - Shows ALL tasks for the project regardless of date
  - Active tasks grouped by date: Yesterday (red label) / Today / Tomorrow / upcoming weekdays / No date
  - Each row: status icon (○ / ● / ✓) + title + urgency badge + time slot
  - Completed tasks section at the bottom with muted label
  - "＋ Add task" button — calls `addTask({ title: 'New task', projectId })` then opens TaskDetail
  - Selector bug fixed: selects `s.tasks` then filters outside the selector to avoid infinite re-render loop

#### Chat Section
- [x] 21.5 Create `components/project/ProjectChat.tsx`
  - Message history in `useState<Message[]>` — session only
  - Empty state: "Tell me what's happening…"
  - Auto-scrolls to latest message after each exchange
  - Resets to `[]` when `projectId` changes via `useEffect`
  - Selector bug fixed: `allTasks` selected then filtered outside selector
- [x] 21.6 Create `components/project/ChatMessage.tsx`
  - User messages: right-aligned, blue accent background
  - AI messages: left-aligned, surface background with hairline border
  - Error messages: red tint background
  - Action results shown as `✓ label` lines below AI message text
  - Loading state: three animated bouncing dots
- [x] 21.7 Create `components/project/ChatInput.tsx`
  - Textarea auto-grows up to 96px (~4 lines) via `scrollHeight` measurement
  - Send on Enter; Shift+Enter inserts newline
  - Disabled while loading
  - Clears after send
- [x] 21.8 Wire full chat flow in `ProjectChat.tsx`:
  - On send → append user message → POST to `/api/ai/project-chat` with task snapshot + history
  - On response → parse `message` + `actions` → execute each against Zustand store
    - `create_task` → `addTask({ ...payload, projectId })`
    - `update_task` → `updateTask(id, patch)`
    - `complete_task` → `completeTask(id)` (handles recurrence correctly)
    - `delete_task` → `deleteTask(id)`
  - Action labels computed before execution (so deleted task titles are captured)
  - Append AI message with pre-computed `actionResults` for display
- [x] 21.9 Error handling — API failure shows error bubble in chat, input re-enables for retry

#### AI Settings Respect
- [x] 21.10 If `aiEnabled = false` — chat section replaced with "Enable AI in Settings to use chat" note; task list remains fully functional

#### Breakdown Improvements (done alongside Part 20)
- [x] 21.11 `app/api/ai/breakdown/route.ts` — updated to return rich subtask objects instead of plain strings
  - New schema: `{ subtasks: { title, urgency, importance, duration }[] }`
  - AI distributes parent's total duration proportionally by complexity
  - AI assigns urgency/importance per subtask based on criticality
  - Passes parent `duration` and `scheduledDate` to the AI for context
- [x] 21.12 `TaskDetail.tsx` breakdown panel — richer suggestion display
  - Each row shows urgency badge, importance badge, live scheduled time, and duration (`30m`)
  - Live time preview updates as checkboxes change — shows exact time each subtask will receive
  - Deselecting a subtask closes the time gap: remaining selected tasks shift forward correctly
- [x] 21.13 `applyBreakdown` — subtasks now created with full fields
  - Each subtask gets its own AI-assigned `urgency`, `importance`, `duration`
  - Sequential `scheduledTime` assigned starting from parent's time, advancing by each duration
  - Inherits parent's `scheduledDate` and `tags`

### Files Created / Modified
```
app/(app)/projects/[id]/page.tsx          (new)
app/api/ai/project-chat/route.ts          (new)
app/api/ai/breakdown/route.ts             (updated — rich subtask schema)
components/project/ProjectTaskList.tsx    (new)
components/project/ProjectChat.tsx        (new)
components/project/ChatMessage.tsx        (new)
components/project/ChatInput.tsx          (new)
components/layout/Sidebar.tsx             (project links updated)
components/task/TaskDetail.tsx            (breakdown panel + applyBreakdown updated)
```

### Tests & Success Criteria (Tier 1 + 2)
- [x] Clicking a project in sidebar navigates to `/projects/[id]`
- [x] All project tasks appear grouped by date with correct status icons
- [x] Clicking a task opens TaskDetail drawer correctly
- [x] "＋ Add task" creates a task in the project and opens TaskDetail
- [x] Typing "create a task for writing tests" creates the task immediately in the list
- [x] Typing "mark X as done" completes the correct task — list updates instantly
- [x] Typing "make X urgent" updates urgency — badge appears on task row
- [x] Typing "I finished X and Y" completes both tasks in one message
- [x] Typing "what should I work on next?" returns a suggestion with no task mutations
- [x] AI creates separate tasks when asked for multiple (e.g. "one per professor")
- [x] Relative dates ("tomorrow", "yesterday") resolve to correct ISO dates
- [x] Scheduled time set on created tasks — not embedded in title
- [x] AI action results shown as ✓ lines below each AI message
- [x] Conversation history carries context — AI remembers earlier messages in session
- [x] Switching projects resets chat history
- [x] Chat hidden and note shown when `aiEnabled = false`
- [x] API failure shows error bubble, input re-enables
- [x] Breakdown suggestions show urgency/importance badges, time, and duration per row
- [x] Deselecting a breakdown subtask closes the time gap for remaining selected tasks
- [x] `tsc --noEmit` passes with zero errors