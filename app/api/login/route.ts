import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { openDb } from "@/db/db";

/**
 * Body = { email, password }
 * - Validates credentials against Users table
 *      session_role   = "Admin" | "Staff" | "Donor" - 
 *      session_user_id = the numeric Users.User_ID - ID
 */
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const db = await openDb();
    const user = await db.get<{
      User_ID: number;
      Full_Name: string;
      Email: string;
      User_Role: "Admin" | "Donor" | "Staff";
      Password_Hash: string;
    }>(
      `SELECT User_ID, Full_Name, Email, User_Role, Password_Hash
       FROM Users
       WHERE LOWER(Email) = LOWER(?)`,
      [email]
    );

    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const stored = user.Password_Hash ?? "";
    const ok = stored.startsWith("$2")
      ? await bcrypt.compare(password, stored) // bcrypt hash pass
      : password === stored;                   // seed/plain (for the old legacy passwords)

    if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    
    const safeUser = {
      User_ID: user.User_ID,
      Full_Name: user.Full_Name,
      Email: user.Email,
      User_Role: user.User_Role,
    };

    // Set BOTH cookies.
    const res = NextResponse.json({ message: "Login successful", user: safeUser }, { status: 200 });

    res.cookies.set("session_role", user.User_Role, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
      secure: process.env.NODE_ENV === "production",
    });

    res.cookies.set("session_user_id", String(user.User_ID), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
      secure: process.env.NODE_ENV === "production",
    });

    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
