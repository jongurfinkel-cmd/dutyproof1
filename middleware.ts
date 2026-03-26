import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protected dashboard routes — redirect to login if not authenticated
  const isProtected = req.nextUrl.pathname.startsWith('/dashboard')
    || req.nextUrl.pathname.startsWith('/watches')
    || req.nextUrl.pathname.startsWith('/facilities')
    || req.nextUrl.pathname.startsWith('/history')
    || req.nextUrl.pathname.startsWith('/billing')

  if (isProtected && !user) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect logged-in users away from auth pages
  const isAuth = req.nextUrl.pathname === '/login'
    || req.nextUrl.pathname === '/signup'
    || req.nextUrl.pathname === '/forgot-password'
  if (isAuth && user) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/watches/:path*',
    '/facilities/:path*',
    '/history/:path*',
    '/billing/:path*',
    '/login',
    '/signup',
    '/forgot-password',
  ],
}
