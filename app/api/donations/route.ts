import { NextRequest, NextResponse } from "next/server";
import { openDb } from "@/db/db";

export async function POST(req: NextRequest) {
  try {
    const userId = Number(req.cookies.get("session_user_id")?.value || 0);// Get user ID from cookies
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });// Check for valid user session
    }

    const body = await req.json();
    const donationId: number = Number(body?.donationId);
    if (!donationId) {
      return NextResponse.json({ error: "donationId required" }, { status: 400 });//this makes sure that donationid isnt null or undefined
    }

    const db = await openDb();// open new database connection

    // Update Inventory (if exists)
    await db.run(
      `UPDATE Inventory
       SET Status = 'InStock',
           Updated_At = datetime('now')
       WHERE Donation_ID = ?`,
      [donationId]
    );

    // Update Sent_Status in Donations
    const result = await db.run(
      `UPDATE Donations
       SET Sent_Status = 'Sent'
       WHERE Donation_ID = ?`,
      [donationId]
    );

    if (result.changes === 0) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });// Check if any row was updated
    }

    // Notify all staff
    const staffUsers: { User_ID: number }[] = await db.all(// Get all staff user IDs
      `SELECT User_ID FROM Users WHERE Role = 'Staff'`
    );

    for (const staff of staffUsers) {
      await db.run(
        `INSERT INTO Notifications (User_ID, Donation_ID, Status, Generated_At)
         VALUES (?, ?, 'Donation Sent', datetime('now'))`,
        [staff.User_ID, donationId]// Insert notification for each staff user
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("send API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });// Ensure any errors are logged and a generic error response is returned.
  }
}
