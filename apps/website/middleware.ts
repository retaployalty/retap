import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()

  // Handle domain redirects for production
  if (process.env.NODE_ENV === 'production') {
    const hostname = req.headers.get('host')
    
    // Redirect www to non-www
    if (hostname?.startsWith('www.')) {
      const newUrl = req.nextUrl.clone()
      newUrl.hostname = hostname.replace('www.', '')
      return NextResponse.redirect(newUrl, 301)
    }
  }

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

  // Check if the request is for the dashboard
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    // If not authenticated, redirect to login
    if (!session) {
      return NextResponse.redirect(new URL('/auth', req.url))
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
    '/dashboard/:path*',
  ],
} 