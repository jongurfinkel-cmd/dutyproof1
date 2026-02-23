import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, completions } = body

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    if (!Array.isArray(completions) || completions.length === 0) {
      return NextResponse.json({ error: 'Completions required' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Find the watch
    const { data: watch, error } = await admin
      .from('watches')
      .select('id, status, checklist_completed_at')
      .eq('checklist_token', token)
      .single()

    if (error || !watch) {
      return NextResponse.json({ error: 'Invalid checklist token.' }, { status: 404 })
    }

    if (watch.status !== 'active') {
      return NextResponse.json({ error: 'This watch has ended.' }, { status: 410 })
    }

    if (watch.checklist_completed_at) {
      return NextResponse.json({ error: 'Checklist already completed.' }, { status: 409 })
    }

    // Insert completions
    const now = new Date().toISOString()
    const rows = completions.map((c: { item_id: string; photo_url?: string | null }) => ({
      watch_id: watch.id,
      item_id: c.item_id,
      completed_at: now,
      photo_url: c.photo_url ?? null,
      checklist_token: token,
    }))

    const { error: insertError } = await admin.from('checklist_completions').insert(rows)
    if (insertError) {
      console.error('Checklist completions insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save checklist.' }, { status: 500 })
    }

    // Mark watch checklist as completed
    const { error: updateError } = await admin
      .from('watches')
      .update({ checklist_completed_at: now })
      .eq('id', watch.id)

    if (updateError) {
      console.error('Checklist completed_at update error:', updateError)
    }

    return NextResponse.json({ success: true, completedAt: now })
  } catch (err) {
    console.error('Checklist complete error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
