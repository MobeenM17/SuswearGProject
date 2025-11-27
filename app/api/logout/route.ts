import { NextResponse } from "next/server";

// clears the cookie for role / id by changing the max age to 0 - and redirects them to homepage '/'
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session_role", "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax" });
  res.cookies.set("session_user_id", "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax" });
  return res;
}
