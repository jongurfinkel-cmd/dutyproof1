import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(req, { limit: 30, windowSec: 60, prefix: 'checklist-upload' })
    if (limited) return limited
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const watchId = formData.get('watch_id') as string | null
    const itemId = formData.get('item_id') as string | null

    const token = formData.get('checklist_token') as string | null

    if (!file || !watchId || !itemId || !token) {
      return NextResponse.json({ error: 'file, watch_id, item_id, and checklist_token are required' }, { status: 400 })
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(watchId) || !uuidRegex.test(itemId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }
    if (!/^[0-9a-f]{64}$/.test(token)) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verify token belongs to this watch, watch is active, and checklist not already completed
    const { data: watch } = await admin
      .from('watches')
      .select('id, status, checklist_completed_at')
      .eq('id', watchId)
      .eq('checklist_token', token)
      .single()

    if (!watch) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
    }

    if (watch.status !== 'active') {
      return NextResponse.json({ error: 'This watch has ended.' }, { status: 410 })
    }

    if (watch.checklist_completed_at) {
      return NextResponse.json({ error: 'Checklist already completed.' }, { status: 409 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, WebP, or HEIC images are allowed.' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 10 MB.' }, { status: 400 })
    }

    // Derive extension from validated MIME type, not user-supplied filename
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/heic': 'heic',
    }
    const ext = mimeToExt[file.type] ?? 'jpg'
    const path = `${watchId}/${itemId}/${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await admin.storage
      .from('checklist-photos')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload photo.' }, { status: 500 })
    }

    const { data: urlData } = admin.storage.from('checklist-photos').getPublicUrl(path)

    return NextResponse.json({ photo_url: urlData.publicUrl })
  } catch (err) {
    console.error('Checklist upload error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
