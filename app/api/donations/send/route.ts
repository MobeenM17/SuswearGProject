import { NextRequest, NextResponse } from "next/server";
import { openDb } from "@/db/db";

export async function POST(req: NextRequest) {
  try {
    const userId = Number(req.cookies.get("session_user_id")?.value || 0);// Get user ID from cookies
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });// Check for valid user session

// Get user ID from cookies
    const body = await req.json();
    const donationId: number = Number(body?.donationId);
    const charityId: number = Number(body?.charityId);

    if (!donationId)
      return NextResponse.json(
        { error: "donationId required" },//this makes sure that donationid isnt null or undefined
        { status: 400 }
      );

    const db = await openDb();// open new database connection

    // Update Inventory from Arriving -> InStock
    
    await db.run(// Update Inventory status to InStock and set Charity_ID
      `UPDATE Inventory
       SET Status = 'InStock',
       Charity_ID = ?,
           Updated_At = datetime('now')
       WHERE Donation_ID = ?`,
      [charityId, donationId]// Bind charityId and donationId to the query
    );

    // Update Donation sent status
    await db.run(
      `UPDATE Donations
       SET Sent_Status = 'Sent'
       WHERE Donation_ID = ?`,
      [donationId]// Bind donationId to the query
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }// Ensure any errors are logged and a generic error response is returned.
}
