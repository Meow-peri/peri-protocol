import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)

// PATCH /api/doctor-visits/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const b = await req.json()
    const visit = await db.doctorVisit.update({
      where: { id },
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
    console.error('PATCH /api/doctor-visits/[id]', e)
    return NextResponse.json({ error: 'Failed to update doctor visit' }, { status: 500 })
  }
}

// DELETE /api/doctor-visits/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.doctorVisit.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/doctor-visits/[id]', e)
    return NextResponse.json({ error: 'Failed to delete doctor visit' }, { status: 500 })
  }
}
