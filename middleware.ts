import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const role = req.cookies.get("session_role")?.value;
  const { pathname } = req.nextUrl;

  // Skip API routes
 if (pathname.startsWith("/api")) return NextResponse.next();

  // Private pages
  const isPrivate = pathname.startsWith("/admin") || pathname.startsWith("/staff") || pathname.startsWith("/donor");
  if (isPrivate && !role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && role !== "Admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/staff") && role !== "Staff") {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/donor") && role !== "Donor") {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*", "/donor/:path*"],
};
