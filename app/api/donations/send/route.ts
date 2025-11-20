import { NextRequest, NextResponse } from "next/server";
import { openDb } from "@/db/db";

export async function POST(req: NextRequest) {
  try {
    const userId = Number(req.cookies.get("session_user_id")?.value || 0);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const donationId: number = Number(body?.donationId);
    if (!donationId)
      return NextResponse.json(
        { error: "donationId required" },
        { status: 400 }
      );

    const db = await openDb();

    // Update Inventory from Arriving -> InStock
    await db.run(
      `UPDATE Inventory
       SET Status = 'InStock',
           Updated_At = datetime('now')
       WHERE Donation_ID = ?`,
      [donationId]
    );

    // Update Donation sent status
    await db.run(
      `UPDATE Donations
       SET Sent_Status = 'Sent'
       WHERE Donation_ID = ?`,
      [donationId]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
