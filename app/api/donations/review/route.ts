// app/api/donations/review/route.ts
import { NextResponse } from "next/server";
import { openDb } from "@/db/db";

// Simple shape the front-end sends
type Body = {
  donationId: number;             // required
  action: "accept" | "reject";    // required
  notes?: string;                 // optional text staff typed
  staffId?: number;               // optional (useful later when you add auth)
};

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as Partial<Body>;

    // 1) Validate basic input
    if (!body?.donationId || !body?.action) {
      return NextResponse.json(
        { error: "donationId and action are required" },
        { status: 400 }
      );
    }

    const donationId = Number(body.donationId);
    const action = body.action;

    const db = await openDb();

    // 2) Read current donation state (also get Donor_ID for notifications)
    const current = await db.get<{
      Status: "Pending" | "Accepted" | "Rejected" | "Distributed";
      Donor_ID: number;
    } | null>(
      `SELECT Status, Donor_ID
       FROM Donations
       WHERE Donation_ID = ?`,
      [donationId]
    );

    if (!current) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    // Block re-processing
    if (current.Status !== "Pending") {
      return NextResponse.json(
        { error: `This donation is already ${current.Status.toLowerCase()}.` },
        { status: 409 }
      );
    }

    // 3) Make changes in a tiny transaction for safety
    await db.exec("BEGIN");

    if (action === "accept") {
      // 3a) Mark donation as Accepted
      await db.run(
        `UPDATE Donations SET Status = 'Accepted' WHERE Donation_ID = ?`,
        [donationId]
      );

      // 3b) (Optional) Create a minimal Inventory record for it
      //     Only Donation_ID is required; Status defaults to 'InStock'.
      await db.run(
        `INSERT OR IGNORE INTO Inventory (Donation_ID) VALUES (?)`,
        [donationId]
      );

      // 3c) (Optional) Save a staff review row if staffId is provided
      if (body.staffId) {
        await db.run(
          `INSERT INTO Reviews (Donation_ID, Staff_ID, Decision, Notes)
           VALUES (?, ?, 'Accepted', ?)`,
          [donationId, body.staffId, body.notes ?? null]
        );
      }

      // 3d) Create a queued Notification for the donor
      await db.run(
        `INSERT INTO Notifications (User_ID, Donation_ID, Status)
         VALUES (?, ?, 'Queued')`,
        [current.Donor_ID, donationId]
      );
    } else {
      // action === "reject"

      // 3e) Mark donation as Rejected
      await db.run(
        `UPDATE Donations SET Status = 'Rejected' WHERE Donation_ID = ?`,
        [donationId]
      );

      // 3f) (Optional) Save a staff review if staffId is provided
      if (body.staffId) {
        await db.run(
          `INSERT INTO Reviews (Donation_ID, Staff_ID, Decision, Notes)
           VALUES (?, ?, 'Rejected', ?)`,
          [donationId, body.staffId, body.notes ?? null]
        );
      }

      // 3g) Notify donor (queued)
      await db.run(
        `INSERT INTO Notifications (User_ID, Donation_ID, Status)
         VALUES (?, ?, 'Queued')`,
        [current.Donor_ID, donationId]
      );
    }

    await db.exec("COMMIT");

    // 4) Done
    return NextResponse.json(
      { ok: true, donationId, status: action === "accept" ? "Accepted" : "Rejected" },
      { status: 200 }
    );
  } catch (err) {
    console.error("PUT /api/donations/review error:", err);
    // If anything blew up mid-transaction, try to rollback quietly
    try {
      const db = await openDb();
      await db.exec("ROLLBACK");
    } catch {}
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
