import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)

// PATCH /api/labs/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const b = await req.json()
    const lab = await db.labResult.update({
      where: { id },
      data: {
        test: str(b?.test),
        result: str(b?.result),
        referenceRange: str(b?.referenceRange),
        date: str(b?.date),
        note: str(b?.note),
      },
    })
    return NextResponse.json(lab)
  } catch (e) {
    console.error('PATCH /api/labs/[id]', e)
    return NextResponse.json({ error: 'Failed to update lab result' }, { status: 500 })
  }
}

// DELETE /api/labs/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.labResult.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/labs/[id]', e)
    return NextResponse.json({ error: 'Failed to delete lab result' }, { status: 500 })
  }
}
