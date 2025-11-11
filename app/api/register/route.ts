import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { openDb } from "@/db/db";

// email + password rules conditions
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-={}[\]:;"'<>,.?/`~]{8,}$/;

export async function POST(req: Request) {
  try {
    // gets values from the frontend
    const { fullName, email, password } = await req.json();

    //  validation check from text-box
    if (!fullName || !email || !password) {
      return NextResponse.json({ error: "Full name, email and password are required." }, { status: 400 });
    }
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        { error: "Password must be ≥8 chars and contain letters and numbers." },
        { status: 400 },
      );
    }

    const db = await openDb();

    // 3) check if user already exists
    const exists = await db.get(`SELECT 1 FROM Users WHERE LOWER(Email)=LOWER(?)`, [email]);
    if (exists) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    // 4) hash password
    const hash = await bcrypt.hash(password, 10);

    // 5) create user row 
    await db.run(
      `INSERT INTO Users (Full_Name, Email, Password_Hash, User_Role)
       VALUES (?, ?, ?, 'Donor')`,
      [fullName.trim(), email.trim(), hash],
    );

    // 6) insert it into donor role
    await db.run(
      `INSERT INTO Donor (User_ID, Full_Name, Email, Password_Hash, User_Role)
       SELECT User_ID, Full_Name, Email, Password_Hash, 'Donor'
       FROM Users
       WHERE LOWER(Email)=LOWER(?)`,
      [email.trim()],
    );

    return NextResponse.json({ message: "Registration successful. You can now log in!" }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
