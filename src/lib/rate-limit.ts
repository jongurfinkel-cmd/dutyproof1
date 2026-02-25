import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const MAX_STORE_SIZE = 10_000
const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

/**
 * Simple in-memory rate limiter. Returns null if allowed, or a 429 Response if blocked.
 * @param req       - The incoming request (IP extracted from headers)
 * @param limit     - Max requests per window
 * @param windowSec - Window size in seconds
 * @param prefix    - Key prefix to scope limits per endpoint
 */
export function rateLimit(
  req: NextRequest,
  { limit = 30, windowSec = 60, prefix = '' } = {}
): NextResponse | null {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  const key = `${prefix}:${ip}`
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    // Evict oldest entries if store is full to prevent memory exhaustion
    if (store.size >= MAX_STORE_SIZE) {
      const firstKey = store.keys().next().value
      if (firstKey) store.delete(firstKey)
    }
    store.set(key, { count: 1, resetAt: now + windowSec * 1000 })
    return null
  }

  entry.count++

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      }
    )
  }

  return null
}
