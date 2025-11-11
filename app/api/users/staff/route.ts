// app/api/users/admin/staff/route.ts
import { NextResponse } from "next/server";
import { openDb } from "@/db/db";

export async function GET() {
  const db = await openDb();
  const staff = await db.all(
    "SELECT u.User_ID, u.Full_Name, u.Email FROM Users u JOIN Staff s ON s.User_ID = u.User_ID ORDER BY u.Full_Name"
  );
  return NextResponse.json(staff);
}
