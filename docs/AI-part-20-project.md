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
- [ ] 21.1 Create `app/api/ai/project-chat/route.ts` — POST endpoint
  - Accepts `{ messages: { role: 'user' | 'assistant', content: string }[], projectTitle: string, tasks: { id: string, title: string, status: string, urgency: string, importance: string, scheduledDate: string | null }[] }`
  - Returns `{ message: string, actions?: ChatAction[] }`
  - System prompt includes full task list + action schema instructions
  - Strips markdown fences before JSON parse
  - Falls back to `{ message: rawText, actions: [] }` if JSON parse fails

#### Prompt Design
```
System: You are a task manager for the project "{projectTitle}".

Current tasks:
{tasks.map(t => `- [${t.id}] [${t.status}] ${t.title} (urgency: ${t.urgency}, importance: ${t.importance}${t.scheduledDate ? `, due: ${t.scheduledDate}` : ''})`).join('\n')}

The user will tell you what's happening. Act immediately on their tasks.

Always respond with ONLY a valid JSON object:
{
  "message": "conversational reply describing what you did",
  "actions": [
    { "type": "complete_task", "payload": { "id": "task-id-here" } },
    { "type": "update_task", "payload": { "id": "task-id-here", "patch": { "urgency": "high" } } },
    { "type": "create_task", "payload": { "title": "New task", "urgency": "low", "importance": "high" } }
  ]
}

If no task actions are needed (e.g. user asks a question), return actions as empty array [].
Match tasks by title similarity — use the id field when acting on existing tasks.
No markdown, no explanation outside the JSON.
```

#### Project Page
- [ ] 21.2 Create `app/(app)/projects/[id]/page.tsx` — project page shell
  - Reads `projectId` from URL params
  - Fetches project + tasks from Zustand store
  - Redirects to `/` if project not found
  - Two sections: TaskList (top, scrollable) + ChatSection (bottom, fixed height)
- [ ] 21.3 Update `Sidebar.tsx` — project links navigate to `/projects/[id]`

#### Task List Section
- [ ] 21.4 Create `components/project/ProjectTaskList.tsx`
  - Shows all tasks in the project
  - Each row: status icon (○ / ● / ✓) + title + urgency badge if high + scheduled date if set
  - Clicking a task row opens existing `TaskDetail` drawer
  - "＋ Add task" button at bottom — opens QuickCapture pre-filled with `projectId`
  - Completed tasks shown with strikethrough at the bottom of the list
  - Task list updates in real-time as AI executes actions

#### Chat Section
- [ ] 21.5 Create `components/project/ProjectChat.tsx`
  - Message history in `useState<Message[]>` — session only
  - On mount: no welcome message — just empty state "Tell me what's happening..."
  - Auto-scrolls to latest message after each exchange
  - Resets when `projectId` changes
- [ ] 21.6 Create `components/project/ChatMessage.tsx`
  - User messages: right-aligned, accent background
  - AI messages: left-aligned, stone surface
  - AI message shows what actions were taken as a subtle list below the message text:
    ```
    ✓ Marked "Design mockups" as done
    ✓ Set "API integration" to urgent
    ```
  - Loading state: three animated dots while waiting
- [ ] 21.7 Create `components/project/ChatInput.tsx`
  - Textarea, auto-grows up to 4 lines
  - Send on Enter (Shift+Enter for newline)
  - Disabled while loading
  - Clears after send
  - Placeholder: "What's happening with this project?"
- [ ] 21.8 Wire full chat flow in `ProjectChat.tsx`:
  - On send → append user message → POST to `/api/ai/project-chat` with full task list + history
  - On response → parse `message` + `actions`
  - Execute each action against Zustand store:
    - `create_task` → `addTask({ ...payload, projectId })`
    - `update_task` → `updateTask(id, patch)`
    - `complete_task` → `toggleStatus(id)`
    - `delete_task` → `deleteTask(id)`
  - Append AI message to history with action results
  - Task list above updates immediately via Zustand (optimistic)
- [ ] 21.9 Error handling — API failure shows error bubble in chat, input re-enables for retry

#### AI Settings Respect
- [ ] 21.10 If `aiEnabled = false` in `ui.ts` — chat section is hidden, page shows task list only with a note "Enable AI in settings to use chat"

### Files Created / Modified
```
app/(app)/projects/[id]/page.tsx          (new)
app/api/ai/project-chat/route.ts          (new)
components/project/ProjectTaskList.tsx    (new)
components/project/ProjectChat.tsx        (new)
components/project/ChatMessage.tsx        (new)
components/project/ChatInput.tsx          (new)
components/layout/Sidebar.tsx             (project links updated)
```

### Tests & Success Criteria (Tier 1 + 2)
- [ ] Clicking a project in sidebar navigates to `/projects/[id]`
- [ ] All project tasks appear in the task list with correct status icons
- [ ] Clicking a task opens TaskDetail drawer correctly
- [ ] "＋ Add task" pre-fills QuickCapture with correct `projectId`
- [ ] Typing "create a task for writing tests" creates the task immediately in the list
- [ ] Typing "mark X as done" completes the correct task — list updates instantly
- [ ] Typing "make X urgent" updates urgency — badge appears on task row
- [ ] Typing "I finished X and Y" completes both tasks in one message
- [ ] Typing "what should I work on next?" returns a suggestion with no task mutations
- [ ] AI action results shown as ✓ lines below each AI message
- [ ] Conversation history carries context — AI remembers earlier messages in the session
- [ ] Switching projects resets chat history
- [ ] Chat hidden and note shown when `aiEnabled = false`
- [ ] API failure shows error bubble, input re-enables
- [ ] `tsc --noEmit` passes with zero errors