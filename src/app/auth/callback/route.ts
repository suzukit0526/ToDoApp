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

    if (!code) {
      console.error('No code provided in callback');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Create a new response object
    const response = NextResponse.redirect(new URL(next, requestUrl.origin));
    
    // Create Supabase client with the response object
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookies() 
    }, {
      cookieOptions: {
        name: 'sb-auth-token',
        path: '/',
        domain: requestUrl.hostname,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      }
    });
    
    console.log('Attempting to exchange code for session...');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    console.log('Successfully exchanged code for session');
    
    // Verify the session was created
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Error getting session:', sessionError);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    console.log('Session verified successfully');
    console.log('User email:', session.user.email);

    return response;
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
} 