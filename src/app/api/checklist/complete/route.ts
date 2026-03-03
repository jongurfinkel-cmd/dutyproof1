import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(req, { limit: 10, windowSec: 60, prefix: 'checklist-complete' })
    if (limited) return limited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const { token, completions } = body

    if (!token || typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    if (!Array.isArray(completions) || completions.length === 0 || completions.length > 50) {
      return NextResponse.json({ error: 'Completions required (max 50)' }, { status: 400 })
    }

    // Reject duplicate item_ids
    const seenIds = new Set<string>()
    for (const c of completions) {
      if (!c.item_id || typeof c.item_id !== 'string') {
        return NextResponse.json({ error: 'Each completion must have an item_id' }, { status: 400 })
      }
      if (seenIds.has(c.item_id)) {
        return NextResponse.json({ error: 'Duplicate item submission detected' }, { status: 400 })
      }
      seenIds.add(c.item_id)
    }

    const admin = createAdminClient()

    // Find the watch and its items
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

    // Fetch the actual checklist items to validate against
    const { data: items, error: itemsError } = await admin
      .from('watch_checklist_items')
      .select('id, requires_photo')
      .eq('watch_id', watch.id)

    if (itemsError || !items || items.length === 0) {
      return NextResponse.json({ error: 'No checklist items found.' }, { status: 400 })
    }

    // Build a lookup of submitted completions
    const submittedMap = new Map(
      completions.map((c: { item_id: string; photo_url?: string | null }) => [c.item_id, c])
    )

    // Validate every item was submitted and required photos are present
    for (const item of items) {
      const submitted = submittedMap.get(item.id)
      if (!submitted) {
        return NextResponse.json(
          { error: 'All checklist items must be completed before submitting.' },
          { status: 400 }
        )
      }
      if (item.requires_photo && !submitted.photo_url) {
        return NextResponse.json(
          { error: 'All required photos must be uploaded before submitting.' },
          { status: 400 }
        )
      }
    }

    // Insert completions (only for items that belong to this watch)
    const now = new Date().toISOString()
    const rows = items.map((item) => {
      const submitted = submittedMap.get(item.id)
      return {
        watch_id: watch.id,
        item_id: item.id,
        completed_at: now,
        photo_url: submitted?.photo_url ?? null,
        checklist_token: token,
      }
    })

    const { error: insertError } = await admin
      .from('checklist_completions')
      .upsert(rows, { onConflict: 'watch_id,item_id' })
    if (insertError) {
      console.error('Checklist completions upsert error:', insertError)
      return NextResponse.json({ error: 'Failed to save checklist.' }, { status: 500 })
    }

    // Mark watch checklist as completed — if this fails, the worker is stuck
    const { error: updateError } = await admin
      .from('watches')
      .update({ checklist_completed_at: now })
      .eq('id', watch.id)

    if (updateError) {
      console.error('Checklist completed_at update error:', updateError)
      // Completions were inserted but the watch wasn't stamped — return error so
      // the worker knows to retry rather than thinking they're done
      return NextResponse.json({ error: 'Failed to finalize checklist. Please try submitting again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, completedAt: now })
  } catch (err) {
    console.error('Checklist complete error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
