import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;

    // 1. Define paths that require authentication
    const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard');
    const isLoginPage = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup' || request.nextUrl.pathname === '/';

    // 2. If trying to access dashboard without a token, redirect to login
    if (isDashboardPage) {
        if (!token) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        try {
            // Verify the JWT
            const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
            await jwtVerify(token, secret);
            return NextResponse.next();
        } catch (error) {
            // Token is invalid or expired
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('auth_token'); // Clean up the bad cookie
            return response;
        }
    }

    // 3. If user is already logged in and tries to go to login/signup, redirect to dashboard
    if (isLoginPage && token) {
        try {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
            await jwtVerify(token, secret);
            return NextResponse.redirect(new URL('/dashboard', request.url));
        } catch (e) {
            // Token invalid, allow them to stay on login page
        }
    }

    return NextResponse.next();
}

// 4. Configure which paths trigger the middleware
export const config = {
    matcher: ['/dashboard/:path*', '/login', '/signup' , '/'],
};