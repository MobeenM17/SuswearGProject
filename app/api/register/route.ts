import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { openDb } from "@/db/db"; // adjust path if needed

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, password } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    const db = await openDb();

    // Check if email already exists
    const existing = await db.get("SELECT * FROM Users WHERE Email = ?", [
      email,
    ]);
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered." },
        { status: 400 }
      );
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user with Donor role
    await db.run(
      "INSERT INTO Users (Full_Name, Email, Password_Hash, User_Role) VALUES (?, ?, ?, ?)",
      [fullName, email, hashedPassword, "Donor"]
    );

    return NextResponse.json(
      { message: "Registration successful" },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
