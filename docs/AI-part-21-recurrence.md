---

## Part 21: Recurrence Detection in Project Chat

### Phase 0 Required: No (extends Part 20)

### Context
Extends the project chat AI to detect recurring task requests from natural language and produce `create_task` / `update_task` actions with the correct `recurrence` and `customDays` fields. Also auto-fills `scheduledDate` for recurring tasks so they actually appear on the timeline.

### Why This Was Needed
Part 20 shipped project chat with create/update/complete/delete actions, but the schema didn't include `recurrence`. Users saying "add a daily standup at 9am" got a one-off task — no daily repetition, and often no date at all (so the task never appeared anywhere).

### Substeps

#### Schema Updates
- [x] 21.14 Add `RecurrenceSchema` (`'none' | 'daily' | 'weekly' | 'weekdays' | 'custom'`) to `app/api/ai/project-chat/route.ts`
- [x] 21.15 Extend `create_task` payload schema with optional `recurrence` and `customDays` (array of weekday integers 0–6)
- [x] 21.16 Extend `PatchSchema` (used by `update_task`) with the same recurrence fields so the AI can also retroactively set recurrence on an existing task

#### Prompt Updates
- [x] 21.17 Add recurrence detection rules to the system prompt:
  - "every day" / "daily" → `daily`
  - "every week" / "every Monday" → `weekly`
  - "weekdays" / "Mon–Fri" → `weekdays`
  - "every Mon and Thu" → `custom` + `customDays: [1, 4]`
  - No mention of repetition → omit recurrence
- [x] 21.18 Document the `customDays` integer mapping (0=Sun … 6=Sat) so the AI doesn't guess
- [x] 21.19 Add recurrence examples to the JSON-schema example block in the prompt — without examples, the model defaults to the simpler shape it sees demonstrated
- [x] 21.20 Auto-fill `scheduledDate` whenever `recurrence` is set (a recurring task with no start date never appears in any view):
  - `daily` → today
  - `weekdays` → today if today is Mon–Fri, otherwise next Monday
  - `weekly` with a named weekday → next occurrence of that weekday
  - `custom` → nearest future date matching any `customDays` entry

#### Plumbing
- [x] 21.21 Verify `addTask` in `store/tasks.ts` already reads `partial.recurrence` and `partial.customDays` (it did — no store change needed)
- [x] 21.22 Verify `taskToDb` mapper persists `recurrence` and `custom_days` columns (it did)
- [x] 21.23 No client component changes required — `addTask({ ...action.payload, projectId })` already spreads the new fields through

### Files Modified
```
app/api/ai/project-chat/route.ts          (schema + prompt updates)
docs/AI-part-20-project.md                (substeps marked complete)
docs/AI-part-21-recurrence.md             (new — this file)
```

### How Recurrence Actually Generates New Instances
The recurrence engine in `store/tasks.ts` (`completeTask`) does *not* pre-generate future instances. When a recurring task is marked done, `nextOccurrenceDate` + `buildInstance` create exactly one new instance for the next valid date. This is intentional — it avoids ballooning the task list with a year of future repetitions and keeps the timeline focused on what's actually next.

### Tests & Success Criteria (Tier 1 + 2)
- [x] "daily standup at 9am" → task created with `recurrence: 'daily'`, `scheduledDate` = today, `scheduledTime` = `09:00`
- [x] "weekly review every Friday at 3pm" → `recurrence: 'weekly'`, `scheduledDate` = next Friday, `scheduledTime: '15:00'`
- [x] "team check-in every Monday and Wednesday" → `recurrence: 'custom'`, `customDays: [1, 3]`, `scheduledDate` = next Mon or Wed
- [x] "morning workout on weekdays" → `recurrence: 'weekdays'`, `scheduledDate` = today if Mon–Fri else next Monday
- [x] Non-recurring requests ("call dentist tomorrow") still produce one-off tasks without recurrence
- [x] Completing a daily task spawns the next day's instance automatically
- [x] Recurrence dropdown in TaskDetail correctly displays the value set by AI
- [x] `tsc --noEmit` passes with zero errors
