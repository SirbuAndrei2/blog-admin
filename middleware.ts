import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request: NextRequest) {
    // Skip auth in development
    if (process.env.NODE_ENV === 'development') {
        return NextResponse.next();
    }

    // If we are accessing an admin route that is not the login page
    if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login')) {
        const token = request.cookies.get('auth_token')?.value;

        if (!token) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        const payload = await verifyToken(token);

        if (!payload) {
            // Invalid token, delete it and redirect
            const response = NextResponse.redirect(new URL('/admin/login', request.url));
            response.cookies.delete('auth_token');
            return response;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
