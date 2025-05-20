import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession()

  // Check if the request is for the admin panel
  if (req.nextUrl.pathname.startsWith('/admin-panel')) {
    // Skip middleware for login page
    if (req.nextUrl.pathname === '/admin-panel/login') {
      return res
    }

    // Check if admin is authenticated
    const isAdminAuthenticated = req.cookies.get('adminAuthenticated')?.value === 'true'

    // If not authenticated, redirect to login
    if (!isAdminAuthenticated) {
      return NextResponse.redirect(new URL('/admin-panel/login', req.url))
    }
  }

  return res
}

// Specify which routes should be protected
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    '/admin-panel/:path*',
  ],
} 