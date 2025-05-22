import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  try {
    console.log('=== Middleware Debug ===');
    console.log('Current path:', request.nextUrl.pathname);

    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res });

    // セッションの更新を試みる
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log('Session exists:', !!session);
    if (session) {
      console.log('User email:', session.user.email);
    }
    if (error) {
      console.error('Session error:', error);
    }

    // 認証コールバックのパスはスキップ
    if (request.nextUrl.pathname === '/auth/callback') {
      console.log('Skipping auth callback path');
      return res;
    }

    // 未認証ユーザーをログインページにリダイレクト
    if (!session && request.nextUrl.pathname !== '/login') {
      console.log('Redirecting to login page');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 認証済みユーザーをログインページからリダイレクト
    if (session && request.nextUrl.pathname === '/login') {
      console.log('Redirecting authenticated user to home');
      return NextResponse.redirect(new URL('/', request.url));
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 