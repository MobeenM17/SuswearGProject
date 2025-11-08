import { NextResponse } from "next/server"; // use to clear the cookie session which treats it as a logout function

export async function POST() {
  const res = NextResponse.json({ checkPassword: true });
  // deletes the cookie by making it expired by changing the max age to 0
  res.cookies.set("session_role", "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax" });
  return res;
}
