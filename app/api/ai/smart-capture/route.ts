import { NextResponse } from 'next/server'
import { z } from 'zod'
import { openrouter, AI_MODEL } from '@/lib/openrouter'

const SYSTEM_PROMPT = `You are a task parser. Extract task details from natural language input and return ONLY a JSON object with these fields: title (string), notes (string, empty if none), urgency ("high" or "low"), importance ("high" or "low"), scheduledDate (ISO date string YYYY-MM-DD or null), scheduledTime ("HH:MM" 24-hour format or null), duration (minutes as integer or null), tags (array of strings). Today's date is provided in the user message. No explanation, no markdown, just the JSON object.`

const SmartCaptureSchema = z.object({
  title: z.string().min(1),
  notes: z.string().default(''),
  urgency: z.enum(['high', 'low']).default('low'),
  importance: z.enum(['high', 'low']).default('low'),
  scheduledDate: z.string().nullable().default(null),
  scheduledTime: z.string().nullable().default(null),
  duration: z.number().int().positive().nullable().default(null),
  tags: z.array(z.string()).default([]),
})

export async function POST(req: Request) {
  try {
    const { input, today } = await req.json()
    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: 'input is required' }, { status: 400 })
    }

    const completion = await openrouter.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Today is ${today ?? new Date().toISOString().slice(0, 10)}. Input: "${input}"` },
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

    const result = SmartCaptureSchema.safeParse(parsed)
    if (!result.success) {
      return NextResponse.json({ error: 'AI response has unexpected shape', details: result.error.flatten() }, { status: 502 })
    }

    return NextResponse.json(result.data)
  } catch (err) {
    console.error('[smart-capture]', err)
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 })
  }
}
