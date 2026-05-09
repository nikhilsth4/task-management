import { NextResponse } from 'next/server'
import { z } from 'zod'
import { openrouter, AI_MODEL } from '@/lib/openrouter'

const SubtaskSchema = z.object({
  title: z.string().min(1),
  urgency: z.enum(['high', 'low']),
  importance: z.enum(['high', 'low']),
  duration: z.number().int().positive(),
})

const BreakdownSchema = z.object({
  subtasks: z.array(SubtaskSchema).min(1).max(7),
})

const SYSTEM_PROMPT = `You are a task planner. Given a task, break it into 3–7 concrete, actionable subtasks.

Return ONLY a JSON object:
{
  "subtasks": [
    { "title": "short action title", "urgency": "high" | "low", "importance": "high" | "low", "duration": <minutes as integer> }
  ]
}

Rules:
- Distribute the parent's total duration across subtasks proportionally by complexity. If no duration given, estimate reasonably (each subtask under 120 min).
- Assign urgency and importance per subtask based on how critical that step is.
- Keep titles short and action-oriented.
- No markdown, no explanation outside the JSON.`

export async function POST(req: Request) {
  try {
    const { title, notes, projectTitle, duration, scheduledDate } = await req.json()
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const completion = await openrouter.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: JSON.stringify({
            title,
            notes: notes || '',
            projectTitle: projectTitle || undefined,
            totalDuration: duration ?? null,
            scheduledDate: scheduledDate ?? null,
          }),
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

    const result = BreakdownSchema.safeParse(parsed)
    if (!result.success) {
      return NextResponse.json({ error: 'AI response has unexpected shape', details: result.error.flatten() }, { status: 502 })
    }

    return NextResponse.json(result.data)
  } catch (err) {
    console.error('[breakdown]', err)
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 })
  }
}
