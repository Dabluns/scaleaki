import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { api } from '@/lib/api';

const PUBLIC_PATHS = ['/login', '/register', '/api/auth'];
const PROTECTED_PREFIXES = ['/dashboard', '/ofertas', '/oferta'];

const JWT_SECRET = process.env.JWT_SECRET;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public
  if (
    pathname === '/' ||
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // API proxy uses nookies token (handled in api.ts)
  if (pathname.startsWith('/api/proxy')) {
    return NextResponse.next();
  }

  // Protected
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const token = req.cookies.get('scaleaki_token')?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    if (JWT_SECRET) {
      try {
        await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
      } catch {
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png).*)'],
};