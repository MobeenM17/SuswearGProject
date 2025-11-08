
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { openDb } from "@/db/db";

export async function POST(req: Request) {
  try {
    // read JSON data
    const { email, password } = await req.json();

    // safety check
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // opens the database and gets the user row by email
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

    // invalid user detail: 
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // compare the password in two possible ways:
    // 1) new registered details: the stored value is a bcrypt hash
    // 2) old login in details in db: treat it as a simple seed/plain string
    const storedPassword = user.Password_Hash ?? "";
    let checkPassword = false;
    if (storedPassword.startsWith("$2")) {
      checkPassword = await bcrypt.compare(password, storedPassword);
    } else {
      checkPassword = password === storedPassword;
    }
    if (!checkPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // creates a safe object with the user details to send back to the client (no password included)
    const safeUser = {
      User_ID: user.User_ID,
      Full_Name: user.Full_Name,
      Email: user.Email,
      User_Role: user.User_Role,
    };

    // set a cookie (HttpOnly) that only stores the user's role.
    const res = NextResponse.json({ message: "Login successful", user: safeUser }, { status: 200 });
    res.cookies.set("session_role", user.User_Role, {
      httpOnly: true,     // - HttpOnly so its more secure and javascript cant read 
      sameSite: "lax", // normal navigation keeps the cookie
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
      secure: process.env.NODE_ENV === "production",
    });

    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
