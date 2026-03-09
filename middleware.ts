import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware for Protected Routes
 * Redirects unauthenticated users trying to access protected pages to the login page
 *
 * TODO: Migration to Next.js proxy pattern in Phase 2
 * Current middleware.ts convention is deprecated in favor of proxy configuration.
 * This will be refactored when upgrading to the new pattern.
 * Reference: https://nextjs.org/docs/messages/middleware-to-proxy
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public paths that don't require authentication
  const publicPaths = [
    '/login',
    '/signup',
    '/auth-callback',
    '/oauth-callback',
    '/api/auth',
    '/api/roles',
  ];

  // Check if the current path is public
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Allow public GET requests to /api/content (viewing published content)
  if (pathname === '/api/content' && request.method === 'GET') {
    return NextResponse.next();
  }

  // Allow public GET requests to /api/organizations (viewing org structure)
  if (pathname.startsWith('/api/organizations') && request.method === 'GET') {
    return NextResponse.next();
  }

  if (isPublicPath) {
    return NextResponse.next();
  }

  // For protected paths, create a server-side Supabase client to check session
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  // Check if user has a valid session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session and trying to access protected route, redirect to login
  if (!session) {
    if (!pathname.startsWith('/api')) {
      // For page routes, redirect to login
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      return NextResponse.redirect(loginUrl);
    }

    // For API routes, return 401 Unauthorized
    return NextResponse.json(
      { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      {
        status: 401,
      }
    );
  }

  // User is authenticated, allow the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public/* (public files)
     * - api/auth/* (auth endpoints are always public)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)',
  ],
};
