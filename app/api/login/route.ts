import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { openDb } from "@/db/db"; // adjust path if needed

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const db = await openDb();
    const user = await db.get<{
      User_ID: number;
      Full_Name: string;
      Email: string;
      User_Role: "Admin" | "Donor" | "Staff";
      Password_Hash: string;
    }>(
      `
      SELECT User_ID, Full_Name, Email, User_Role, Password_Hash
      FROM Users
      WHERE LOWER(Email) = LOWER(?)
      `,
      [email]
    );

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Accept both bcrypt hashes and old seed strings (e.g. "hash_admin")
    let ok = false;
    const stored = user.Password_Hash ?? "";

    if (stored.startsWith("$2")) {
      // bcrypt hash
      ok = await bcrypt.compare(password, stored);
    } else {
      // legacy seed value (plain text)
      ok = password === stored;
    }

    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Return a safe user payload (no password)
    const safeUser = {
      User_ID: user.User_ID,
      Full_Name: user.Full_Name,
      Email: user.Email,
      User_Role: user.User_Role,
    };

    return NextResponse.json(
      { message: "Login successful", user: safeUser },
      { status: 200 }
    );
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
