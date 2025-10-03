import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  console.log('[MIDDLEWARE] Pathname:', pathname, 'User:', user ? user.id : 'none')

  // Root path handling - redirect to /magang landing page
  if (pathname === '/') {
    console.log('[MIDDLEWARE] Root path detected, redirecting to /magang')
    return NextResponse.redirect(new URL('/magang', request.url))
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/auth-test', '/debug', '/magang', '/laporan']
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/magang/')
  
  console.log('[MIDDLEWARE] Is public route?', isPublicRoute)
  
  if (isPublicRoute) {
    // If user is already logged in and trying to access login/register, redirect to main
    if (user && (pathname === '/login' || pathname === '/register')) {
      console.log('[MIDDLEWARE] Logged in user accessing login/register, redirecting to /main')
      return NextResponse.redirect(new URL('/main', request.url))
    }
    console.log('[MIDDLEWARE] Public route, allowing access')
    return response
  }

  // Protected routes that require authentication
  if (pathname.startsWith('/main') || pathname.startsWith('/presensi')) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    return response
  }

  // Admin routes that require admin role
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // For now, allow any authenticated user to access admin (bypassing DB check due to RLS issues)
    // TODO: Fix RLS policy and re-enable proper admin role checking
    console.log('Admin access granted for user:', user.id)
    
    return response
  }

  // Default: allow access to any other routes
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public images)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images/).*)',
  ],
}