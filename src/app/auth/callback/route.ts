import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/';
    
    console.log('=== Auth Callback Debug ===');
    console.log('Request URL:', request.url);
    console.log('Code:', code);
    console.log('Next:', next);
    console.log('Hash:', requestUrl.hash);

    if (!code) {
      console.error('No code provided in callback');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    console.log('Attempting to exchange code for session...');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    console.log('Successfully exchanged code for session');
    console.log('Session data:', data);
    
    // セッションが正しく設定されたか確認
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    console.log('Session after exchange:', session ? 'exists' : 'none');
    if (session) {
      console.log('User email:', session.user.email);
    }

    // 認証成功後、ホームページにリダイレクト
    const response = NextResponse.redirect(new URL(next, requestUrl.origin));
    console.log('Redirecting to:', response.headers.get('location'));
    return response;
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
} 