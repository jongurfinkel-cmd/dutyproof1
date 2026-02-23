import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Find the watch by checklist token
    const { data: watch, error } = await admin
      .from('watches')
      .select('id, status, assigned_name, checklist_completed_at, facilities(name)')
      .eq('checklist_token', token)
      .single()

    if (error || !watch) {
      return NextResponse.json({ error: 'Invalid checklist link.' }, { status: 404 })
    }

    if (watch.status !== 'active') {
      return NextResponse.json({ error: 'This watch has ended.' }, { status: 410 })
    }

    if (watch.checklist_completed_at) {
      return NextResponse.json({ error: 'This safety checklist has already been completed.' }, { status: 410 })
    }

    // Fetch checklist items
    const { data: items, error: itemsError } = await admin
      .from('watch_checklist_items')
      .select('id, label, requires_photo, sort_order')
      .eq('watch_id', watch.id)
      .order('sort_order')

    if (itemsError) {
      return NextResponse.json({ error: 'Failed to load checklist.' }, { status: 500 })
    }

    const facility = watch.facilities as unknown as { name: string }

    return NextResponse.json({
      watchId: watch.id,
      facilityName: facility.name,
      assignedName: watch.assigned_name,
      items: items ?? [],
    })
  } catch (err) {
    console.error('Checklist validate error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
