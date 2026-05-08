import { NextResponse } from 'next/server'
import { z } from 'zod'
import { openrouter, AI_MODEL } from '@/lib/openrouter'

const SYSTEM_PROMPT = `You are a task planner. Given a task title and optional notes, return ONLY a JSON object with a "subtasks" array of 3-7 short, concrete, actionable task titles. Each task should be completable in under 2 hours. No explanation, no markdown, just the JSON object.`

const BreakdownSchema = z.object({
  subtasks: z.array(z.string().min(1)).min(1).max(7),
})

export async function POST(req: Request) {
  try {
    const { title, notes, projectTitle } = await req.json()
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const completion = await openrouter.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: JSON.stringify({ title, notes: notes || '', projectTitle: projectTitle || undefined }),
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
