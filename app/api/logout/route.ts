import { NextResponse } from "next/server";

/**
 * - Clears both cookies
 */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session_role", "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax" });
  res.cookies.set("session_user_id", "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax" });
  return res;
}
