import { NextResponse } from 'next/server'
import { z } from 'zod'
import { openrouter, AI_MODEL } from '@/lib/openrouter'

const SYSTEM_PROMPT = `You are a daily planner. Given a list of tasks and already-scheduled blocks, create a time-blocked schedule for the day. Prioritize urgent+important tasks first, then important, then urgent, then the rest. Respect the work window. Leave 10-minute buffers between tasks. Return ONLY a JSON object with a "schedule" array where each item has: taskId (string), scheduledTime ("HH:MM" 24-hour format), duration (minutes as integer). Only include tasks that fit within the work window. No explanation, no markdown, just the JSON object.`

const PlanDaySchema = z.object({
  schedule: z.array(
    z.object({
      taskId: z.string(),
      scheduledTime: z.string().regex(/^\d{2}:\d{2}$/),
      duration: z.number().int().positive(),
    })
  ),
})

export async function POST(req: Request) {
  try {
    const { tasks, scheduledTasks, workStart, workEnd } = await req.json()

    if (!Array.isArray(tasks)) {
      return NextResponse.json({ error: 'tasks array is required' }, { status: 400 })
    }

    const completion = await openrouter.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: JSON.stringify({ workStart, workEnd, scheduledTasks, tasks }),
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content ?? ''
    const cleaned = raw.replace(/```json|```/g, '').trim()

    let parsed: unknown
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 502 })
    }

    const result = PlanDaySchema.safeParse(parsed)
    if (!result.success) {
      return NextResponse.json({ error: 'AI response has unexpected shape', details: result.error.flatten() }, { status: 502 })
    }

    return NextResponse.json(result.data)
  } catch (err) {
    console.error('[plan-day]', err)
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 })
  }
}
