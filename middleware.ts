import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that do not require authentication
const PUBLIC_PATHS: string[] = [
  '/login',
  '/api/auth/login',
  '/api/auth/me',
];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/_next')) return true; // next internal assets
  if (pathname.startsWith('/api/files/')) return true; // allow public receipt fetch (optional)
  if (pathname === '/favicon.ico') return true;
  if (/\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|txt|map)$/.test(pathname)) return true;
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const uid = req.cookies.get('uid')?.value;
  const authed = !!uid;
  // Debug: log PM overview access
  if (pathname.startsWith('/api/pm/') && req.headers.get('x-debug')) {
    console.log('MW_PM_DEBUG', { pathname, authed, uid });
  }

  if (!authed && !isPublic(pathname)) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (authed && pathname === '/login') {
    return NextResponse.redirect(new URL('/receipts', req.url));
  }
  return NextResponse.next();
}

// Optional matcher if you want to fine-tune
// export const config = { matcher: ['/((?!_next).*)'] };
