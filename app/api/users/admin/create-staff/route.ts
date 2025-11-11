import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { openDb } from "@/db/db";

export async function POST(req: Request) {
  try {
    const db = await openDb();
    const cookies = req.headers.get("cookie") || "";
    const role = cookies.match(/session_role=([^;]+)/)?.[1];

    if (role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { fullName, email, password } = await req.json();

    if (!fullName || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);

    // Add to Users
    const result = await db.run(
      `INSERT INTO Users (Full_Name, Email, Password_Hash, User_Role)
       VALUES (?, ?, ?, 'Staff')`,
      [fullName, email, hash]
    );

    const newUserId = result.lastID;

    // Add to Staff
    await db.run(
      `INSERT INTO Staff (User_ID, Full_Name, Email, Password_Hash, User_Role)
       VALUES (?, ?, ?, ?, 'Staff')`,
      [newUserId, fullName, email, hash]
    );

    return NextResponse.json({ message: "Staff account created successfully" }, { status: 200 });
  } catch (err) {
    console.error("Error creating staff:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
