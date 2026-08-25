import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/weekly — list all weekly notes
export async function GET() {
  try {
    const notes = await db.weeklyNote.findMany({ orderBy: { weekStart: 'desc' } })
    return NextResponse.json(notes)
  } catch (e) {
    console.error('GET /api/weekly', e)
    return NextResponse.json({ error: 'Failed to load weekly notes' }, { status: 500 })
  }
}

// POST /api/weekly — upsert a week's note by weekStart (Monday)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { weekStart, mainSymptom, pattern } = body ?? {}
    if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
      return NextResponse.json({ error: 'A valid weekStart (YYYY-MM-DD) is required' }, { status: 400 })
    }
    const data = {
      mainSymptom: typeof mainSymptom === 'string' && mainSymptom.trim() ? mainSymptom.trim() : null,
      pattern: typeof pattern === 'string' && pattern.trim() ? pattern.trim() : null,
    }
    const note = await db.weeklyNote.upsert({
      where: { weekStart },
      update: data,
      create: { weekStart, ...data },
    })
    return NextResponse.json(note)
  } catch (e) {
    console.error('POST /api/weekly', e)
    return NextResponse.json({ error: 'Failed to save weekly note' }, { status: 500 })
  }
}
