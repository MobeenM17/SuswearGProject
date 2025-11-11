// app/api/donations/list/route.ts
import { NextResponse } from "next/server";
import { openDb } from "@/db/db";

export async function GET() {
  const db = await openDb();
  const rows = await db.all(
    `SELECT
        d.Donation_ID,
        u.Full_Name       AS Donor_Name,
        c.Name            AS Category,
        d.Condition_Grade,
        d.Description,
        d.Submitted_At
     FROM Donations d
     JOIN Donor dn   ON dn.Donor_ID = d.Donor_ID
     JOIN Users u    ON u.User_ID   = dn.User_ID
     JOIN Categories c ON c.CategoryID = d.Category_ID
     WHERE d.Status = 'Pending'
     ORDER BY d.Submitted_At ASC`,
  );
  return NextResponse.json(rows);
}
