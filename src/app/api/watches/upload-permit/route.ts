import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(req, { limit: 10, windowSec: 60, prefix: 'permit-upload' })
    if (limited) return limited

    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, WebP, or HEIC images are allowed.' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 10 MB.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Validate magic bytes
    const h = buffer.subarray(0, 12)
    const isJpeg = h[0] === 0xFF && h[1] === 0xD8 && h[2] === 0xFF
    const isPng = h[0] === 0x89 && h[1] === 0x50 && h[2] === 0x4E && h[3] === 0x47
    const isWebp = h[8] === 0x57 && h[9] === 0x45 && h[10] === 0x42 && h[11] === 0x50
    const isHeic = h[4] === 0x66 && h[5] === 0x74 && h[6] === 0x79 && h[7] === 0x70
    if (!isJpeg && !isPng && !isWebp && !isHeic) {
      return NextResponse.json({ error: 'File contents do not match an allowed image type.' }, { status: 400 })
    }

    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/heic': 'heic',
    }
    const ext = mimeToExt[file.type] ?? 'jpg'
    const path = `permits/${user.id}/${Date.now()}.${ext}`

    const admin = createAdminClient()

    const { error: uploadError } = await admin.storage
      .from('watch-evidence')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Permit upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload photo.' }, { status: 500 })
    }

    const { data: signedData, error: signedError } = await admin.storage
      .from('watch-evidence')
      .createSignedUrl(path, 60 * 60 * 24 * 365) // 1 year

    if (signedError || !signedData?.signedUrl) {
      console.error('Signed URL error:', signedError)
      return NextResponse.json({ error: 'Failed to generate photo URL.' }, { status: 500 })
    }

    return NextResponse.json({ photo_url: signedData.signedUrl })
  } catch (err) {
    console.error('Permit upload error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
