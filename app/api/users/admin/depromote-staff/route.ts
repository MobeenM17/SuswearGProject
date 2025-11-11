// app/api/users/admin/depromote-staff/route.ts
import { NextResponse } from "next/server";
import { openDb } from "@/db/db";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const db = await openDb();

    // Get staff row
    const staff = await db.get(
      "SELECT * FROM Staff WHERE User_ID = ?", [userId]
    );
    if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

    // Update Users table role
    await db.run("UPDATE Users SET User_Role = 'Donor' WHERE User_ID = ?", [userId]);

    // Insert into Donor table
    await db.run(
      `INSERT INTO Donor (User_ID, Full_Name, Email, Password_Hash, User_Role)
       VALUES (?, ?, ?, ?, 'Donor')`,
      [userId, staff.Full_Name, staff.Email, staff.Password_Hash]
    );

    // Delete from Staff table
    await db.run("DELETE FROM Staff WHERE User_ID = ?", [userId]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
