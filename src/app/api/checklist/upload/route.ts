import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const watchId = formData.get('watch_id') as string | null
    const itemId = formData.get('item_id') as string | null

    if (!file || !watchId || !itemId) {
      return NextResponse.json({ error: 'file, watch_id, and item_id are required' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, WebP, or HEIC images are allowed.' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 10 MB.' }, { status: 400 })
    }

    const admin = createAdminClient()

    const ext = file.name.split('.').pop() ?? 'jpg'
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
