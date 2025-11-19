//app/api/donations/review/route.ts
import { NextRequest, NextResponse } from "next/server";
import { openDb } from "@/db/db";


// Staff reviews a donation:
export async function PUT(req: NextRequest) {
  try {
    // session cookies (auth)
    const role = req.cookies.get("session_role")?.value;
    const staffUserId = Number(req.cookies.get("session_user_id")?.value || 0);

    if (role !== "Staff" || !staffUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Read payload
    const body = await req.json();
    const donationId: number = Number(body?.donationId);
    const action: "accept" | "reject" = body?.action;
    const notes: string | undefined = body?.reason ?? undefined;

    // Optional inventory fields (only used on accept)
    const sizeLabel: string | undefined = body?.sizeLabel ?? undefined;
    const genderLabel: string | undefined = body?.genderLabel ?? undefined;
    const seasonType: string | undefined = body?.seasonType ?? undefined;
    const conditionGrade: string | undefined = body?.conditionGrade ?? undefined;


    if (!donationId || !action) {
      return NextResponse.json(
        { error: "donationId and action are required." },
        { status: 400 }
      );
    }

    const db = await openDb();

    //Update donation status 
    const newStatus = action === "accept" ? "Accepted" : "Rejected";
    await db.run(
      `UPDATE Donations SET Status = ?, Submitted_At = Submitted_At WHERE Donation_ID = ?`,
      [newStatus, donationId]
    );

    await db.run(

      `UPDATE Donations SET Condition_Grade = COALESCE (?, Condition_Grade) WHERE Donation_ID = ?`, 
      [conditionGrade ?? null, donationId]

    )

    // Insert a review 
    await db.run(
      `INSERT INTO Reviews (Donation_ID, Staff_ID, Decision, Notes, Uploaded_At)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [donationId, staffUserId, newStatus, notes ?? null]
    );

    // accepted- create/keep inventory row 
    if (newStatus === "Accepted") {
      await db.run(
        `INSERT OR IGNORE INTO Inventory
           (Donation_ID, Size_Label, Gender_Label, Season_Type, Status, Updated_At)
         VALUES (?, ?, ?, ?, 'InStock', datetime('now'))`,
        [
          donationId,
          sizeLabel ?? null,
          genderLabel ?? null,
          seasonType ?? null,
        ]
      );

      // inventory already existed it updates labels & timestamp.
      await db.run(
        `UPDATE Inventory
           SET Size_Label = COALESCE(?, Size_Label),
               Gender_Label = COALESCE(?, Gender_Label),
               Season_Type = COALESCE(?, Season_Type),
               Status = 'InStock',
               Updated_At = datetime('now')
         WHERE Donation_ID = ?`, /* ? is used so i can store it at the end when adding values*/
        [sizeLabel ?? null, genderLabel ?? null, seasonType ?? null, donationId]
      );
    }

    // Create a notification for the donor 
    // Find the donor's User_ID from the Donation.
    const donorUser = await db.get<{ User_ID: number }>(
      `SELECT u.User_ID
         FROM Donations d
         JOIN Donor dn   ON dn.Donor_ID = d.Donor_ID
         JOIN Users u    ON u.User_ID   = dn.User_ID
       WHERE d.Donation_ID = ?`, /* ? is used so i can store it at the end when adding values*/
      [donationId]
    );

    if (donorUser?.User_ID) {
      await db.run(
        `INSERT INTO Notifications (User_ID, Donation_ID, Status, Generated_At)
         VALUES (?, ?, ?, datetime('now'))`,
        [donorUser.User_ID, donationId, newStatus]
      );
    }

    return NextResponse.json({ ok: true, status: newStatus });
  } catch (err) {
    console.error("review PUT error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
