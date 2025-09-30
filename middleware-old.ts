import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get user session
  const { data: { user } } = await supabase.auth.getUser()

  // Define route categories
  const protectedRoutes = ['/main', '/presensi']
  const adminOnlyRoutes = ['/admin']
  const publicRoutes = ['/login', '/register']
  
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )
  const isAdminRoute = adminOnlyRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )
  const isPublicRoute = publicRoutes.some(route => 
    req.nextUrl.pathname === route
  )
  const isRootPath = req.nextUrl.pathname === '/'

  // If no user and trying to access protected routes
  if ((isProtectedRoute || isAdminRoute) && !user) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If admin route, check admin role
  if (isAdminRoute && user) {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin' || !profile.is_active) {
        // Redirect non-admin users away from admin routes
        return NextResponse.redirect(new URL('/main', req.url))
      }
    } catch (error) {
      // If we can't verify admin status, redirect to main
      return NextResponse.redirect(new URL('/main', req.url))
    }
  }

  // If authenticated user trying to access login/register, redirect to main
  if (isPublicRoute && user) {
    return NextResponse.redirect(new URL('/main', req.url))
  }

  // Handle root path
  if (isRootPath) {
    if (user) {
      return NextResponse.redirect(new URL('/main', req.url))
    } else {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return res
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