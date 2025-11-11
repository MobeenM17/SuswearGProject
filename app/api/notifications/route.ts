// app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { openDb } from "@/db/db";

// gets the logged in donor notifications.

export async function GET(req: NextRequest) {
  try {
    const role = req.cookies.get("session_role")?.value;
    const userId = Number(req.cookies.get("session_user_id")?.value || 0);

    if (role !== "Donor" || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await openDb();
    const rows = await db.all<
      { Notification_ID: number; Donation_ID: number; Status: string; Generated_At: string }[]
    >(
      `SELECT Notification_ID, Donation_ID, Status, Generated_At
         FROM Notifications
        WHERE User_ID = ?
        ORDER BY datetime(Generated_At) DESC
        LIMIT 20`,
      [userId]
    );

    return NextResponse.json(rows ?? []);
  } catch (e) {
    console.error("notifications GET error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
