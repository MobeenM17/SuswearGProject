import { NextResponse } from "next/server";
import { openDB } from "@/db/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const db = await openDB();

    // Get user by email
    const user = await db.get(
      "SELECT * FROM Users WHERE Email = ?",
      [email]
    );

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Plain-text password comparison (temporary)
    if (password !== user.Password_Hash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Successful login
    return NextResponse.json({ message: "Login successful", user });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
