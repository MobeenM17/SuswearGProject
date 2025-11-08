//This is used to stop people from accessing other website pages that does not match their role.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const role = req.cookies.get("session_role")?.value; // retrieves the session_role from the login api.
  const { pathname } = req.nextUrl;

  // If the path is private (admin/staff/donor) and cant detect a role it redirects to it /login
  const isPrivate = pathname.startsWith("/admin") || pathname.startsWith("/staff") || pathname.startsWith("/donor");
  if (isPrivate && !role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // website entry based off user logged in role:
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
