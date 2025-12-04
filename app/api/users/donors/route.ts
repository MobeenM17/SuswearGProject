
import { NextResponse } from "next/server";
import { openDb } from "@/db/db";// Import database connection utility

export async function GET() {
  const db = await openDb();
  const rows = await db.all(
    `SELECT u.User_ID, u.Full_Name, u.Email
     FROM Users u
     JOIN Donor d ON d.User_ID = u.User_ID
     ORDER BY u.Full_Name`,
  );// Retrieve all users who are donors, ordered by full name

  return NextResponse.json(rows);// Return the list of donors as a JSON response
}
