// app/api/users/donors/route.ts
import { NextResponse } from "next/server";
import { openDb } from "@/db/db";

export async function GET() {
  const db = await openDb();
  const rows = await db.all(
    `SELECT u.User_ID, u.Full_Name, u.Email
     FROM Users u
     JOIN Donor d ON d.User_ID = u.User_ID
     ORDER BY u.Full_Name`,
  );
  return NextResponse.json(rows);
}
