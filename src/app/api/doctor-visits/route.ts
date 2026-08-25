import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)

// GET /api/doctor-visits
export async function GET() {
  try {
    const visits = await db.doctorVisit.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(visits)
  } catch (e) {
    console.error('GET /api/doctor-visits', e)
    return NextResponse.json({ error: 'Failed to load doctor visits' }, { status: 500 })
  }
}

// POST /api/doctor-visits — create a prep sheet
export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    const visit = await db.doctorVisit.create({
      data: {
        appointmentDate: str(b?.appointmentDate),
        clinician: str(b?.clinician),
        chapter: str(b?.chapter),
        symptom1: str(b?.symptom1),
        symptom2: str(b?.symptom2),
        symptom3: str(b?.symptom3),
        timingPattern: str(b?.timingPattern),
        script: str(b?.script),
        questions: str(b?.questions),
        decisions: str(b?.decisions),
      },
    })
    return NextResponse.json(visit)
  } catch (e) {
    console.error('POST /api/doctor-visits', e)
    return NextResponse.json({ error: 'Failed to save doctor visit' }, { status: 500 })
  }
}
