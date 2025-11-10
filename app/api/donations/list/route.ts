// app/api/donations/list/route.ts
import { NextResponse } from "next/server";
import { openDb } from "@/db/db"; // imports database

// get the /api/donations/list
export async function GET() {
  try {
    const db = await openDb();

    // Select pending donations (joins Users + Categories)
    const rows = await db.all<{
      Donation_ID: number;
      Donor_Name: string;
      Description: string;
      Condition_Grade: string;
      Category: string;
      Submitted_At: string;
    }>(
      `
      SELECT
        d.Donation_ID,
        u.Full_Name  AS Donor_Name,
        d.Description,
        d.Condition_Grade,
        c.Name       AS Category,
        d.Submitted_At
      FROM Donations d
      JOIN Users u      ON u.User_ID     = d.Donor_ID
      JOIN Categories c ON c.CategoryID  = d.Category_ID
      WHERE d.Status = 'Pending'
      ORDER BY d.Submitted_At ASC;
      `
    );

    return NextResponse.json(rows, { status: 200 });
  } catch (err) {
    console.error("GET /api/donations/list error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
