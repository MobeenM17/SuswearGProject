import { NextResponse } from "next/server";
import { openDb } from "@/db/db";

export async function GET() {
  try {
    const db = await openDb();

    // Return all donors for dropdown
    const donors = await db.all(`
      SELECT User_ID, Full_Name AS name, Email
      FROM Users
      WHERE User_Role = 'Donor'
    `);

    return NextResponse.json(donors);
  } catch (err) {
    console.error("❌ Error fetching donors:", err);
    return NextResponse.json({ error: "Failed to load donors" }, { status: 500 });
  }
}
