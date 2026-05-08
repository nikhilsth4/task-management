--
## Part 19: AI Features (OpenRouter)
 
### Phase 0 Required: Yes
 
### Context
Three AI features added via OpenRouter API. All AI calls go through Next.js Route Handlers — the API key never touches the client. Uses the OpenAI SDK pointed at OpenRouter's base URL. Free tier model: `meta-llama/llama-3.3-70b-instruct:free` for all three features.
 
### Setup (do before Phase 0)
- [ ] Sign up at openrouter.ai → create API key
- [ ] Add `OPENROUTER_API_KEY=sk-or-...` to `.env.local`
- [ ] Add `OPENROUTER_API_KEY` to Vercel environment variables
- [ ] Install: `npm install openai`
- [ ] Create `lib/openrouter.ts` — shared OpenRouter client
 
```ts
// lib/openrouter.ts
import OpenAI from 'openai'
 
export const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
})
 
export const AI_MODEL = 'meta-llama/llama-3.3-70b-instruct:free'
```
 
---
 
### Feature 1: Smart Capture
 
**What it does:** User types natural language into QuickCapture (e.g. "call dentist tomorrow at 3pm for 30 mins") and AI parses it into a fully structured task. No manual field filling.
 
**UX:** A small ✨ button appears in QuickCapture when the input looks like natural language (length > 15 chars). Clicking it calls the AI, shows a loading spinner, then pre-fills a preview of the parsed task in TaskDetail for confirmation before saving.
 
#### Substeps
- [x] 19.1 Create `app/api/ai/smart-capture/route.ts` — POST endpoint
  - Accepts `{ input: string }`
  - Prompts model to return JSON: `{ title, notes, urgency, importance, scheduledDate, scheduledTime, duration, tags }`
  - System prompt instructs model to return **only valid JSON**, no markdown, no preamble
  - Returns parsed task fields to client
- [x] 19.2 Add ✨ button to `QuickCapture.tsx` — visible when input length > 15 chars
- [x] 19.3 On click: POST to `/api/ai/smart-capture`, show loading state on button
- [x] 19.4 On response: open TaskDetail drawer pre-filled with parsed fields + original title
- [x] 19.5 User confirms or edits before saving — never auto-save AI output
- [x] 19.6 Handle errors gracefully — if AI call fails, fall back to normal task creation with original input as title
#### Prompt Design
```
System: You are a task parser. Extract task details from natural language input and return ONLY a JSON object with these fields: title (string), notes (string, empty if none), urgency ("high" or "low"), importance ("high" or "low"), scheduledDate (ISO date string or null), scheduledTime ("HH:MM" or null), duration (minutes as integer or null), tags (array of strings). No explanation, no markdown, just the JSON object.
 
User: "call dentist tomorrow at 3pm for 30 mins"
```
 
---
 
### Feature 2: Task Breakdown
 
**What it does:** User clicks "Break down" on any task and AI suggests 3–7 concrete subtasks. User can accept all, cherry-pick, or dismiss.
 
**UX:** "Break down" button inside TaskDetail drawer (only shown for top-level tasks with no existing subtasks). Opens an inline suggestion panel below the subtask list showing AI-generated subtasks as checkboxes. User selects which to keep and clicks "Add selected".
 
#### Substeps
- [x] 19.7 Create `app/api/ai/breakdown/route.ts` — POST endpoint
  - Accepts `{ title: string, notes: string, projectTitle?: string }`
  - Returns `{ subtasks: string[] }` — array of 3–7 subtask titles
  - System prompt instructs model to return **only valid JSON**
- [x] 19.8 Add "Break down ✨" button to `TaskDetail.tsx`
- [x] 19.9 On click: POST to `/api/ai/breakdown`, show inline loading state
- [x] 19.10 Render AI suggestions as selectable checkboxes
- [x] 19.11 "Add selected" creates new tasks in same project, inheriting parent urgency + importance
- [x] 19.12 "Dismiss" clears the suggestion panel without saving anything
- [x] 19.13 Button hidden while suggestions panel is open
#### Prompt Design
```
System: You are a task planner. Given a task title and optional notes, return ONLY a JSON object with a "subtasks" array of 3-7 short, concrete, actionable subtask titles. Each subtask should be completable in under 2 hours. No explanation, no markdown, just the JSON object.
 
User: { "title": "Prepare quarterly report", "notes": "Due Friday, for the board" }
```
 
---
 
### Feature 3: Daily Planning Assistant
 
**What it does:** Each morning, user clicks "Plan my day ✨" and AI looks at their unscheduled tasks + today's already-scheduled tasks and suggests a time-blocked schedule for the day. User can accept blocks individually or all at once.
 
**UX:** "Plan my day ✨" button in TimelineView header (only shown when there are unscheduled tasks for today). Opens a modal showing the proposed schedule as a list: "9:00 AM — Write report (90 min)". Each row has an accept/skip toggle. "Apply accepted" bulk-updates the tasks.
 
#### Substeps
- [x] 19.14 Create `app/api/ai/plan-day/route.ts` — POST endpoint
  - Accepts `{ tasks: { id, title, duration, urgency, importance }[], scheduledTasks: { title, scheduledTime, duration }[], workStart: string, workEnd: string }`
  - Returns `{ schedule: { taskId, scheduledTime, duration }[] }`
  - AI fills gaps between already-scheduled tasks with unscheduled ones
  - System prompt instructs model to return **only valid JSON**
- [x] 19.15 Add "Plan my day ✨" button to `TimelineView.tsx` header
- [x] 19.16 On click: collect unscheduled tasks + today's scheduled tasks from store, POST to route
- [x] 19.17 Render suggestions modal with proposed time slots per task
- [x] 19.18 Each suggestion row has accept ✓ / skip ✗ toggle, defaulting to accepted
- [x] 19.19 "Apply" button calls `updateTask` for each accepted suggestion, setting `scheduledDate` + `scheduledTime` + `duration`
- [x] 19.20 AI respects `workStart`/`workEnd` from user settings
- [x] 19.21 Q1 tasks (urgent + important) are scheduled first, Q4 tasks last
#### Prompt Design
```
System: You are a daily planner. Given a list of tasks and already-scheduled blocks, create a time-blocked schedule for the day. Prioritize urgent+important tasks first. Respect the work window. Leave 10-minute buffers between tasks. Return ONLY a JSON object with a "schedule" array where each item has: taskId (string), scheduledTime ("HH:MM"), duration (minutes as integer). Only include tasks that fit within the work window. No explanation, no markdown.
 
User: { "workStart": "09:00", "workEnd": "18:00", "scheduledTasks": [...], "tasks": [...] }
```
 
---
 
### Shared Infrastructure
 
#### Error Handling (all three routes)
- [x] 19.22 Wrap all AI calls in try/catch — return `{ error: string }` on failure
- [x] 19.23 Strip markdown fences before JSON parse: `.replace(/```json|```/g, '').trim()`
- [x] 19.24 Validate JSON shape before returning to client — if invalid, return error
- [x] 19.25 Client shows inline error toast on AI failure, never crashes the UI
#### Loading States
- [x] 19.26 All three features show loading state on their trigger button (spinner, disabled)
- [x] 19.27 Loading state clears on both success and error
#### AI Settings in `app/settings/page.tsx`
- [ ] 19.28 Add "AI Features" section to settings
- [ ] 19.29 Toggle to enable/disable AI features globally (stored in `ui.ts`)
- [ ] 19.30 When disabled: ✨ buttons hidden across all views
### Files Created / Modified
```
lib/openrouter.ts
app/api/ai/smart-capture/route.ts
app/api/ai/breakdown/route.ts
app/api/ai/plan-day/route.ts
components/task/QuickCapture.tsx      (✨ button)
components/task/TaskDetail.tsx        (break down button + suggestion panel)
components/views/timeline/TimelineView.tsx  (plan my day button + modal)
app/settings/page.tsx                 (AI toggle)
store/ui.ts                           (aiEnabled state)
```
 
### Tests & Success Criteria (Tier 1 + 2)
- [ ] Smart Capture: "team standup every monday at 9am for 30 mins" parses correctly — title, time, duration extracted
- [ ] Smart Capture: falls back to plain task creation if AI call fails
- [ ] Smart Capture: never auto-saves — always requires user confirmation
- [ ] Task Breakdown: returns 3–7 subtasks for a vague task title
- [ ] Task Breakdown: "Add selected" creates only checked subtasks
- [ ] Task Breakdown: button hidden when task already has subtasks
- [ ] Daily Planner: proposed schedule respects work hours from settings
- [ ] Daily Planner: Q1 tasks appear earlier in the schedule than Q4 tasks
- [ ] Daily Planner: already-scheduled tasks are not moved
- [ ] All three: `OPENROUTER_API_KEY` never appears in client bundle (`grep -r OPENROUTER_API_KEY .next/` returns nothing)
- [ ] All three: invalid JSON from model is caught and returns error toast
- [ ] AI toggle in settings hides all ✨ buttons when disabled
- [ ] `tsc --noEmit` passes with zero errors