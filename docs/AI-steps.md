# AI Features — What Was Built and How

## Shared Setup

**`lib/openrouter.ts`**
Creates a single OpenAI client that points at OpenRouter instead of OpenAI. All three features share this. The API key, base URL, and model name come from environment variables so they never appear in the browser bundle.

**`.env.local`**
Three variables added:
- `OPENROUTER_BASE_URL` — the OpenRouter API endpoint
- `OPENROUTER_API_KEY` — your secret key (never sent to the browser)
- `OPENROUTER_MODEL` — which AI model to use (e.g. `openai/gpt-oss-120b:free`)

**`store/ui.ts`**
Two things added to the global UI store:
- `aiEnabled` — a boolean that persists across sessions. When false, all ✨ buttons hide.
- `aiPrefill` — temporary storage for AI-parsed task fields so QuickCapture can hand them to TaskDetail.

---

## Feature 1: Smart Capture

**What it does:** You type natural language like "call dentist tomorrow at 3pm for 30 mins" and the AI fills in all the task fields for you.

**Files involved:**

`app/api/ai/smart-capture/route.ts`
- A server-side endpoint (never runs in the browser)
- Receives your raw text input
- Sends it to the AI with instructions to return a JSON object
- Validates the JSON shape with Zod before returning it
- Returns: title, notes, urgency, importance, scheduledDate, scheduledTime, duration, tags

`components/task/QuickCapture.tsx`
- A ✨ button appears when you've typed more than 15 characters and AI is enabled
- Clicking it sends your text to the route above
- On success: creates the task and stores the parsed fields in `aiPrefill`, then opens TaskDetail
- On failure: creates a plain task with your raw text as the title, shows an error message
- The button shows "…" and is disabled while waiting for the AI

`components/task/TaskDetail.tsx`
- On mount, checks if `aiPrefill` has data
- If it does, pre-fills all the form fields (title, notes, urgency, importance, date, time, duration, tags)
- Clears `aiPrefill` immediately so it doesn't re-apply on next open
- User can edit anything before saving — AI output is never auto-saved

---

## Feature 2: Task Breakdown

**What it does:** You click "Break down ✨" on any task and the AI suggests 3–7 smaller tasks. You pick which ones to keep.

**Files involved:**

`app/api/ai/breakdown/route.ts`
- Receives the task title, notes, and optionally the project name
- Asks the AI to return a JSON array of 3–7 short, actionable task titles
- Validates with Zod, returns `{ subtasks: string[] }`

`components/task/TaskDetail.tsx`
- "Break down ✨" button appears below the Notes field when AI is enabled
- Clicking it calls the breakdown route and shows a loading state
- The suggestions appear as checkboxes — all checked by default
- "Add selected" creates new tasks in the same project as the parent, inheriting the parent's urgency and importance
- "Dismiss" clears the suggestions without saving anything
- The button hides while the suggestion panel is open

---

## Feature 3: Plan My Day

**What it does:** You click "✨ Plan my day" in the Timeline view and the AI arranges your unscheduled tasks into a time-blocked schedule for the day. You accept or skip each suggestion before anything is saved.

**Files involved:**

`app/api/ai/plan-day/route.ts`
- Receives: list of unscheduled tasks (id, title, duration, urgency, importance), already-scheduled tasks for today (title, time, duration), and the work window start/end times
- Asks the AI to produce a schedule that fits everything into the work window with 10-minute buffers between tasks, prioritising urgent+important tasks first
- Validates the response with Zod — each item must have a taskId, a valid HH:MM time, and a duration in minutes
- Returns `{ schedule: [...] }`

`components/views/timeline/TimelineView.tsx`
- "✨ Plan my day" button appears in the date navigation bar when AI is enabled and there are unscheduled tasks
- Clicking it collects today's unscheduled tasks and already-scheduled tasks from the store, reads work hours from settings, and calls the route
- A modal opens showing each suggested slot: task title, proposed time, and duration
- Each row has a checkbox (all checked by default) — uncheck to skip a task
- "Apply N tasks" calls `updateTask` for each accepted row, setting the scheduled date, time, and duration
- "Dismiss" closes without saving anything
- The unscheduled panel only shows tasks with no scheduled date at all — tasks from other days do not appear here
