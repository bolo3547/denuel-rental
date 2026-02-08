/**
 * Next.js Security Middleware
 * Handles security headers, CSRF validation, authentication, and authorization
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const TOKEN_NAME = 'denuel_token';
const CSRF_COOKIE_NAME = 'denuel_csrf';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/about',
  '/contact',
  '/properties',
  '/property',
  '/search',
  '/transport',
  '/services',
  '/_next',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/refresh',
  '/api/properties/public',
  '/api/health',
  '/api/webhook',
  '/api/webhooks',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/icons',
  '/images',
  '/static',
];

// Admin-only routes
const ADMIN_ROUTES = [
  '/admin',
  '/api/admin',
];

// Routes that require CSRF validation
const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
}

/**
 * Check if route requires admin access
 */
function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => {
    return pathname === route || pathname.startsWith(route + '/');
  });
}

/**
 * Verify JWT token and return decoded payload
 */
function verifyToken(token: string): { id: string; role: string; exp: number } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      role: decoded.role,
      exp: decoded.exp,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get token from cookie
 */
function getTokenFromCookie(req: NextRequest): string | null {
  const cookie = req.cookies.get(TOKEN_NAME);
  return cookie?.value || null;
}

/**
 * Validate CSRF token
 */
function validateCSRF(req: NextRequest): boolean {
  const headerToken = req.headers.get('x-csrf-token');
  const cookieToken = req.cookies.get(CSRF_COOKIE_NAME)?.value;
  
  if (!headerToken || !cookieToken) {
    return false;
  }
  
  return headerToken === cookieToken;
}

/**
 * Check if token is expired
 */
function isTokenExpired(exp: number): boolean {
  return Date.now() >= exp * 1000;
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=()'
  );
  
  // HSTS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }
  
  return response;
}

/**
 * Main middleware function
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;
  const isApiRoute = pathname.startsWith('/api');
  
  // Create response
  let response = NextResponse.next();
  
  // Add security headers
  response = addSecurityHeaders(response);
  
  // Skip middleware for Next.js internals and static assets
  // This includes _next, public assets, and files with extensions
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/images/') ||
    // Skip files with extensions (but not API routes)
    (/\.[^/]+$/.test(pathname) && !pathname.startsWith('/api/'))
  ) {
    return response;
  }
  
  // CSRF validation for mutating requests
  if (MUTATING_METHODS.includes(method) && isApiRoute) {
    // Skip CSRF for certain public endpoints
    const skipCSRF = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/refresh',
      '/api/webhook',
      '/api/webhooks',
    ].some(route => pathname.startsWith(route));
    
    if (!skipCSRF && !validateCSRF(req)) {
      if (isApiRoute) {
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }
  
  // Check if route is public
  if (isPublicRoute(pathname)) {
    return response;
  }
  
  // Get and verify token
  const token = getTokenFromCookie(req);
  
  if (!token) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    // Redirect to login for page routes
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Verify token
  const decoded = verifyToken(token);
  
  if (!decoded) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    // Redirect to login for page routes
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Check if token is expired
  if (isTokenExpired(decoded.exp)) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 401 }
      );
    }
    // Redirect to login for page routes
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    loginUrl.searchParams.set('reason', 'expired');
    return NextResponse.redirect(loginUrl);
  }
  
  // Check admin access
  if (isAdminRoute(pathname)) {
    if (decoded.role !== 'ADMIN') {
      if (isApiRoute) {
        return NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        );
      }
      // Redirect to home for non-API routes
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
  
  // Add user info to request headers for downstream handlers
  response.headers.set('x-user-id', decoded.id);
  response.headers.set('x-user-role', decoded.role);
  
  return response;
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/data (data files)
     * - favicon.ico, robots.txt, sitemap.xml
     * - Static assets in public folder (images, icons, etc.)
     */
    '/((?!_next/static|_next/image|_next/data|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
