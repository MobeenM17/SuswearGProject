// app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { openDb } from "@/db/db";

// gets the logged in donor notifications by getting the session cookies role / id 

export async function GET(req: NextRequest) {
  try {
    const role = req.cookies.get("session_role")?.value;
    const userId = Number(req.cookies.get("session_user_id")?.value || 0);

    //stop roles that arent donor by accessing the notifications.
    if (role !== "Donor" || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    //opens a connection to database and selects the notifcation table - only pulls 20 notification from the user id
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
