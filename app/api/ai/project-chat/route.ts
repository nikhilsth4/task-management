import { NextResponse } from 'next/server'
import { z } from 'zod'
import { openrouter, AI_MODEL } from '@/lib/openrouter'


const RecurrenceSchema = z.enum(['none', 'daily', 'weekly', 'weekdays', 'custom'])

const PatchSchema = z.object({
  title: z.string().optional(),
  notes: z.string().optional(),
  urgency: z.enum(['high', 'low']).optional(),
  importance: z.enum(['high', 'low']).optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  scheduledDate: z.string().nullable().optional(),
  scheduledTime: z.string().nullable().optional(),
  duration: z.number().nullable().optional(),
  tags: z.array(z.string()).optional(),
  recurrence: RecurrenceSchema.optional(),
  customDays: z.array(z.number().int().min(0).max(6)).optional(),
})

const ChatActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('create_task'),
    payload: z.object({
      title: z.string(),
      urgency: z.enum(['high', 'low']).default('low'),
      importance: z.enum(['high', 'low']).default('low'),
      scheduledDate: z.string().optional(),
      scheduledTime: z.string().optional(),
      duration: z.number().optional(),
      tags: z.array(z.string()).optional(),
      recurrence: RecurrenceSchema.optional(),
      customDays: z.array(z.number().int().min(0).max(6)).optional(),
    }),
  }),
  z.object({
    type: z.literal('update_task'),
    payload: z.object({ id: z.string(), patch: PatchSchema }),
  }),
  z.object({
    type: z.literal('delete_task'),
    payload: z.object({ id: z.string() }),
  }),
  z.object({
    type: z.literal('complete_task'),
    payload: z.object({ id: z.string() }),
  }),
])

const ChatResponseSchema = z.object({
  message: z.string(),
  actions: z.array(ChatActionSchema).default([]),
})

export type ChatAction = z.infer<typeof ChatActionSchema>

export async function POST(req: Request) {
  try {
    const { messages, projectTitle, tasks } = await req.json()

    const taskList = (
      tasks as {
        id: string
        title: string
        status: string
        urgency: string
        importance: string
        scheduledDate: string | null
      }[]
    )
      .map(
        (t) =>
          `- [${t.id}] [${t.status}] ${t.title} (urgency: ${t.urgency}, importance: ${t.importance}${t.scheduledDate ? `, due: ${t.scheduledDate}` : ''})`,
      )
      .join('\n')

    const today = new Date().toISOString().slice(0, 10)

    const systemPrompt = `You are a task manager for the project "${projectTitle}".
Today's date: ${today}.

Current tasks:
${taskList || '(no tasks yet)'}

The user will tell you what's happening. Act immediately on their tasks.

IMPORTANT RULES:
- When the user asks to create tasks for multiple items (e.g. "one per professor", "for each person", "different slots"), create a SEPARATE create_task action for each individual item — never collapse them into one task.
- When a request implies a breakdown (e.g. "reach out to each professor"), infer reasonable individual tasks and create them all.
- You may include multiple actions of the same type in one response.
- Always parse dates and times from natural language. Compute relative dates from today (${today}): "yesterday" = today minus 1 day, "tomorrow" = today plus 1 day, weekday names = nearest future occurrence. Times: "10am" → "10:00", "3:30pm" → "15:30". Set scheduledDate (YYYY-MM-DD) and scheduledTime (HH:MM 24h) fields on the task payload.
- NEVER put the date or time in the task title. Keep titles clean (e.g. "Reach out to Professor Smith", not "Reach out to Professor Smith at 10am tomorrow").
- Detect recurrence from natural language and set the recurrence field:
  • "every day" / "daily" → "daily"
  • "every week" / "weekly" / "every Monday" / "every Friday" → "weekly"
  • "every weekday" / "Mon-Fri" / "weekdays" → "weekdays"
  • "every Monday and Wednesday" / "Tue, Thu, Sat" → "custom" + customDays array (0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday)
  • No mention of repetition → omit recurrence (defaults to none)
- When recurrence is set, ALWAYS also set scheduledDate (a recurring task without a start date never shows up):
  • "daily" → use today (${today}) as scheduledDate
  • "weekdays" → today if today is Mon–Fri, otherwise next Monday
  • "weekly" with a specific weekday (e.g. "every Friday") → next occurrence of that weekday (today if today matches)
  • "custom" with customDays → nearest future date matching any customDay (today if today matches)
  Examples: "daily standup at 9am" → { recurrence: "daily", scheduledDate: "${today}", scheduledTime: "09:00" }. "review every Mon and Thu" → { recurrence: "custom", customDays: [1, 4], scheduledDate: "<next Mon or Thu>" }.

Always respond with ONLY a valid JSON object:
{
  "message": "conversational reply describing what you did",
  "actions": [
    { "type": "complete_task", "payload": { "id": "task-id-here" } },
    { "type": "update_task", "payload": { "id": "task-id-here", "patch": { "urgency": "high", "importance": "high" } } },
    { "type": "create_task", "payload": { "title": "New task", "urgency": "low", "importance": "high" } },
    { "type": "create_task", "payload": { "title": "Daily standup", "urgency": "low", "importance": "high", "scheduledTime": "09:00", "recurrence": "daily" } },
    { "type": "create_task", "payload": { "title": "Team sync", "urgency": "low", "importance": "high", "scheduledTime": "14:00", "recurrence": "custom", "customDays": [1, 3, 5] } }
  ]
}

If no task actions are needed (e.g. user asks a question), return actions as empty array [].
Match tasks by title similarity — use the id field when acting on existing tasks.
No markdown, no explanation outside the JSON.`

    const completion = await openrouter.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    })

    const raw = completion.choices[0]?.message?.content ?? ''
    const cleaned = raw.replace(/```json|```/g, '').trim()

    let parsed: unknown
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ message: raw, actions: [] })
    }

    const result = ChatResponseSchema.safeParse(parsed)
    if (!result.success) {
      const msg =
        typeof parsed === 'object' && parsed !== null && 'message' in parsed
          ? String((parsed as Record<string, unknown>).message)
          : raw
      return NextResponse.json({ message: msg, actions: [] })
    }

    return NextResponse.json(result.data)
  } catch (err) {
    console.error('[project-chat]', err)
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 })
  }
}
