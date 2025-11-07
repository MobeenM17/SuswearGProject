import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // deletes the cookie by making it expired by changing the max age
  res.cookies.set("auth", "", { path: "/", maxAge: 0 });
  return res;
}
