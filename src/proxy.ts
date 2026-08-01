import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// 1. Specify protected and public routes
const protectedRoutes = ['/', '/materials', '/tutor', '/mind-maps', '/flashcards', '/simulados', '/profile'];
const publicRoutes = ['/login'];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // 2. Check route protection status
  const isProtectedRoute = protectedRoutes.some((route) => 
    route === '/' ? path === '/' : path.startsWith(route)
  );
  const isPublicRoute = publicRoutes.includes(path);

  // 3. Get session cookie
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  // 4. Redirect to /login if user is not authenticated on a protected route
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // 5. Redirect to / if user is authenticated and trying to access /login
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  return NextResponse.next();
}

// Routes Proxy should not run on static assets & API
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
