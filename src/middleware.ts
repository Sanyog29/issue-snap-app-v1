import '@/lib/node-polyfill';
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  // Enforce HTTPS redirect on production domains
  const proto = request.headers.get('x-forwarded-proto');
  const host = request.headers.get('host') || '';
  if (proto === 'http' && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    const httpsUrl = new URL(request.url);
    httpsUrl.protocol = 'https:';
    return NextResponse.redirect(httpsUrl, 301);
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Role-based routing: Staff routes require authenticated employee or admin
  if (pathname.startsWith('/staff')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth?tab=employee', request.url));
    }
    const { data: profile } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.user_type !== 'staff' && profile.user_type !== 'admin')) {
      return NextResponse.redirect(new URL('/auth?tab=employee&error=NotStaff', request.url));
    }
  }

  // Admin routes require authenticated admin
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth?tab=employee', request.url));
    }
    const { data: profile } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_type !== 'admin') {
      return NextResponse.redirect(new URL('/auth?tab=employee&error=NotStaff', request.url));
    }
  }

  // My reports requires auth
  if (pathname.startsWith('/me')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  }

  // Settings requires auth
  if (pathname === '/settings') {
    if (!user) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  }

  // Notifications requires auth
  if (pathname === '/notifications') {
    if (!user) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  }

  // Auth pages: redirect to capture screen if already signed in
  if (pathname.startsWith('/auth') && !pathname.startsWith('/auth/callback') && !pathname.startsWith('/auth/profile')) {
    if (user) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Public routes: /, /report/*, /track/[token] — no auth required
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|firebase-messaging-sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
