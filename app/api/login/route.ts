import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { openDb } from "@/db/db";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const db = await openDb();

    // --- Check Users table (Admin/Staff) ---
    const user = await db.get<{
      User_ID: number;
      Full_Name: string;
      Email: string;
      User_Role: "Admin" | "Staff" | "Donor";
      Password_Hash: string;
    }>(
      `SELECT User_ID, Full_Name, Email, User_Role, Password_Hash
       FROM Users
       WHERE LOWER(Email) = LOWER(?)`,
      [email]
    );

    if (user) {
      const stored = user.Password_Hash ?? "";
      const valid = stored.startsWith("$2")
        ? await bcrypt.compare(password, stored)
        : password === stored;

      if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

      const res = NextResponse.json({
        message: "Login successful",
        user: {
          User_ID: user.User_ID,
          Full_Name: user.Full_Name,
          Email: user.Email,
          User_Role: user.User_Role,
        },
      });

      res.cookies.set("session_role", user.User_Role, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        secure: process.env.NODE_ENV === "production",
      });

      res.cookies.set("session_user_id", String(user.User_ID), {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        secure: process.env.NODE_ENV === "production",
      });

      return res;
    }

    // --- Check Donor table ---
    const donor = await db.get<{
      Donor_ID: number;
      User_ID: number;
      Full_Name: string;
      Email: string;
      Password_Hash: string;
    }>(
      `SELECT Donor_ID, User_ID, Full_Name, Email, Password_Hash
       FROM Donor
       WHERE LOWER(Email) = LOWER(?)`,
      [email]
    );

    if (donor) {
      const stored = donor.Password_Hash ?? "";
      const valid = stored.startsWith("$2")
        ? await bcrypt.compare(password, stored)
        : password === stored;

      if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

      const res = NextResponse.json({
        message: "Login successful",
        user: {
          User_ID: donor.User_ID,
          Full_Name: donor.Full_Name,
          Email: donor.Email,
          User_Role: "Donor",
        },
      });

      res.cookies.set("session_role", "Donor", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        secure: process.env.NODE_ENV === "production",
      });

      res.cookies.set("session_user_id", String(donor.User_ID), {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        secure: process.env.NODE_ENV === "production",
      });

      return res;
    }

    return NextResponse.json({ error: "User not found" }, { status: 404 });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
