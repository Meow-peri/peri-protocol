import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)

// GET /api/labs
export async function GET() {
  try {
    const labs = await db.labResult.findMany({ orderBy: [{ test: 'asc' }, { date: 'desc' }] })
    return NextResponse.json(labs)
  } catch (e) {
    console.error('GET /api/labs', e)
    return NextResponse.json({ error: 'Failed to load lab results' }, { status: 500 })
  }
}

// POST /api/labs — create a lab result row
export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    if (!str(b?.test)) {
      return NextResponse.json({ error: 'Test name is required' }, { status: 400 })
    }
    const lab = await db.labResult.create({
      data: {
        test: str(b?.test) as string,
        result: str(b?.result),
        referenceRange: str(b?.referenceRange),
        date: str(b?.date),
        note: str(b?.note),
      },
    })
    return NextResponse.json(lab)
  } catch (e) {
    console.error('POST /api/labs', e)
    return NextResponse.json({ error: 'Failed to save lab result' }, { status: 500 })
  }
}
