import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/entries — list all daily check-ins (optionally ?from=&to=)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const entries = await db.dailyEntry.findMany({
      where: {
        ...(from ? { date: { gte: from } } : {}),
        ...(to ? { date: { lte: to } } : {}),
      },
      orderBy: { date: 'asc' },
    })
    return NextResponse.json(entries)
  } catch (e) {
    console.error('GET /api/entries', e)
    return NextResponse.json({ error: 'Failed to load entries' }, { status: 500 })
  }
}

// POST /api/entries — upsert a day's check-in
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { date, sleepQuality, mood, energy, symptoms, actions } = body ?? {}
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'A valid date (YYYY-MM-DD) is required' }, { status: 400 })
    }
    const clamp = (v: unknown) =>
      v === null || v === undefined || v === '' ? null : Math.min(10, Math.max(1, Math.round(Number(v))))
    const data = {
      sleepQuality: clamp(sleepQuality),
      mood: clamp(mood),
      energy: clamp(energy),
      symptoms: typeof symptoms === 'string' && symptoms.trim() ? symptoms.trim() : null,
      actions: typeof actions === 'string' && actions.trim() ? actions.trim() : null,
    }
    const entry = await db.dailyEntry.upsert({
      where: { date },
      update: data,
      create: { date, ...data },
    })
    return NextResponse.json(entry)
  } catch (e) {
    console.error('POST /api/entries', e)
    return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 })
  }
}
