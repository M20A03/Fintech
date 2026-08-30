import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_FILE = /\.(.*)$/;
const PROTECTED_ROUTES = ['/dashboard', '/settings', '/disbursements', '/analytics', '/checkout'];
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Ignore static assets, public files, and internal next paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('akoin_session_token')?.value;
  const isAuth = Boolean(token);
  const country = req.geo?.country || req.headers.get('x-vercel-ip-country') || 'IN';

  // 1. Bot & Crawler Optimization
  const userAgent = req.headers.get('user-agent') || '';
  const isBot = /bot|crawler|spider|crawling/i.test(userAgent);

  // 2. Auth Route Protection
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !isAuth) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('return_to', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && isAuth) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // 3. Response Construction & Geo-Headers
  const response = NextResponse.next();
  response.headers.set('x-user-country', country);
  response.headers.set('x-is-bot', isBot ? '1' : '0');
  response.headers.set('x-frame-options', 'DENY');
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
