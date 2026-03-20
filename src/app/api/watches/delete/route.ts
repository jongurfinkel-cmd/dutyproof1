import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { watch_id } = await req.json()
    if (!watch_id || typeof watch_id !== 'string') {
      return NextResponse.json({ error: 'Missing watch_id' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Fetch the watch and verify ownership
    const { data: watch, error: fetchErr } = await admin
      .from('watches')
      .select('id, owner_id, status, checklist_token, checklist_completed_at')
      .eq('id', watch_id)
      .single()

    if (fetchErr || !watch) {
      return NextResponse.json({ error: 'Watch not found' }, { status: 404 })
    }

    if (watch.owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Only allow deletion if checklist hasn't been started
    // (i.e., no checklist at all, or checklist exists but not yet completed)
    // AND no check-ins have been completed
    const { data: completedCheckIns } = await admin
      .from('check_ins')
      .select('id')
      .eq('watch_id', watch_id)
      .eq('status', 'completed')
      .limit(1)

    if (completedCheckIns && completedCheckIns.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete a watch that has completed check-ins. End the watch instead.' },
        { status: 409 }
      )
    }

    // If checklist was already completed, don't allow deletion
    if (watch.checklist_completed_at) {
      return NextResponse.json(
        { error: 'Cannot delete a watch after the safety checklist has been completed.' },
        { status: 409 }
      )
    }

    // Safe to delete — clean up in order (foreign key constraints)
    // 1. Delete checklist completions (if any partial)
    await admin.from('checklist_completions').delete().eq('watch_id', watch_id)

    // 2. Delete checklist items
    await admin.from('watch_checklist_items').delete().eq('watch_id', watch_id)

    // 3. Delete alerts
    await admin.from('alerts').delete().eq('watch_id', watch_id)

    // 4. Delete check-ins (only pending/cancelled should remain at this point)
    await admin.from('check_ins').delete().eq('watch_id', watch_id)

    // 5. Delete the watch itself
    const { error: deleteErr } = await admin
      .from('watches')
      .delete()
      .eq('id', watch_id)

    if (deleteErr) {
      console.error('Failed to delete watch:', deleteErr)
      return NextResponse.json({ error: 'Failed to delete watch' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete watch error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
