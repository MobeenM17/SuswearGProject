import { NextResponse } from "next/server";
import { openDb } from "@/db/db";

export async function GET() {
  let db;
  try {
    db = await openDb(); // open new connection per request
    const charities = await db.all<{ Charity_ID: number; Charity_Name: string }>(
      `SELECT Charity_ID, Charity_Name FROM Charity ORDER BY Charity_ID ASC`
    );
    return NextResponse.json(charities);
  } catch (err) {
    console.error("Failed to load charities:", err);
    return NextResponse.json([], { status: 500 });
  } finally {
    // Only close if db was successfully opened
    if (db) {
      try { await db.close(); } catch (_) {}
    }
  }
}
