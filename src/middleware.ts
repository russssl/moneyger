import { type NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    console.log("No session cookie found. Redirecting to login.");
    return NextResponse.redirect(new URL("/login", request.url).toString());
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|register|reset-password|static|forgot-password|$).*)",
  ],
};