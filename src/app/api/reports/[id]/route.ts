import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { renderToBuffer } from '@react-pdf/renderer'
import { WatchReport } from '@/lib/pdf'
import React from 'react'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimit(req, { limit: 5, windowSec: 60, prefix: 'report' })
  if (limited) return limited

  try {
    const { id: watchId } = await params

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Fetch watch + facility
    const { data: watch, error: watchError } = await admin
      .from('watches')
      .select('*, facilities(*)')
      .eq('id', watchId)
      .eq('owner_id', user.id)
      .single()

    if (watchError || !watch) {
      return NextResponse.json({ error: 'Watch not found' }, { status: 404 })
    }

    // Fetch check-ins, alerts, and checklist data
    const [checkInsRes, alertsRes, checklistItemsRes, checklistCompletionsRes] = await Promise.all([
      admin.from('check_ins').select('*').eq('watch_id', watchId).order('scheduled_time', { ascending: true }),
      admin.from('alerts').select('*').eq('watch_id', watchId).order('created_at', { ascending: true }),
      admin.from('watch_checklist_items').select('*').eq('watch_id', watchId).order('sort_order', { ascending: true }),
      admin.from('checklist_completions').select('*').eq('watch_id', watchId),
    ])

    const checkIns = checkInsRes.data ?? []
    const alerts = alertsRes.data ?? []
    const checklistItems = checklistItemsRes.data ?? []
    const checklistCompletions = checklistCompletionsRes.data ?? []

    // Generate PDF — call WatchReport as a function to get the Document element directly
    // (renderToBuffer needs the Document element, not a wrapper component element)
    const doc = WatchReport({
      watch: watch as Parameters<typeof WatchReport>[0]['watch'],
      checkIns: checkIns as Parameters<typeof WatchReport>[0]['checkIns'],
      alerts: alerts as Parameters<typeof WatchReport>[0]['alerts'],
      checklistItems: checklistItems as Parameters<typeof WatchReport>[0]['checklistItems'],
      checklistCompletions: checklistCompletions as Parameters<typeof WatchReport>[0]['checklistCompletions'],
      adminEmail: user.email ?? 'Admin',
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(doc as any)

    const filename = `dutyproof-watch-${watchId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.pdf`

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.byteLength),
      },
    })
  } catch (err) {
    console.error('Report generation error:', err)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
