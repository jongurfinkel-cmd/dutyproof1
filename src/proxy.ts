import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ACTIVE_STATUSES = ['trialing', 'active']

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Redirect authenticated users from landing page to dashboard
  if (pathname === '/' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Redirect unauthenticated users away from protected routes
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/watches') ||
    pathname.startsWith('/facilities') ||
    pathname.startsWith('/history') ||
    pathname.startsWith('/billing')

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if ((pathname === '/login' || pathname === '/signup') && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Check subscription for dashboard routes (not /billing itself)
  const requiresSubscription =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/watches') ||
    pathname.startsWith('/facilities') ||
    pathname.startsWith('/history')

  if (requiresSubscription && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single()

    if (!profile || !ACTIVE_STATUSES.includes(profile.subscription_status ?? '')) {
      const url = request.nextUrl.clone()
      url.pathname = '/billing'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|checkin|checklist|api).*)',
  ],
}
