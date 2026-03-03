import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Service role client — bypasses RLS. Only use in server-side API routes.
// NEVER import this in client components.
// Cached as a singleton to avoid creating a new client per request.
let _admin: SupabaseClient | null = null

export function createAdminClient() {
  if (_admin) return _admin
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase credentials: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  }
  _admin = createClient(
    url,
    key,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
  return _admin
}
