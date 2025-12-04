import { NextResponse } from "next/server";
import { openDb } from "@/db/db";

export async function GET(req: Request) {
  try {
    // Get user ID from cookies
    const cookieHeader = req.headers.get("cookie") || ""; // Get all cookies
    const donorCookie = cookieHeader
      .split(";")
      .find((c) => c.trim().startsWith("session_user_id=")); // Find the specific cookie

    if (!donorCookie)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const userId = parseInt(donorCookie.split("=")[1]);
    if (isNaN(userId))
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });

    const db = await openDb();
    
    // Get Donor_ID
    const donor = await db.get<{ Donor_ID: number }>(
      "SELECT Donor_ID FROM Donor WHERE User_ID = ?",
      [userId]
    );
    if (!donor)
      return NextResponse.json({ error: "Donor not found" }, { status: 404 });

    // Get accepted donations with inventory status
    const donations = await db.all<{
      Donation_ID: number;
      Description: string;
      WeightKg: number | null;
      Tracking: string;
      Submitted_At: string;
      Status: string;
      Inventory_Status: string | null;
    }>( 
      `SELECT d.Donation_ID,
              d.Description,
              d.WeightKg,
              d.Tracking,
              d.Submitted_At,
              d.Status,
              i.Status AS Inventory_Status
       FROM Donations d
       LEFT JOIN Inventory i ON d.Donation_ID = i.Donation_ID
       WHERE d.Donor_ID = ?
         AND d.Status = 'Accepted'
         AND d.Tracking IS NOT NULL
       ORDER BY d.Submitted_At DESC`,
      [donor.Donor_ID]
    );

    return NextResponse.json(donations);
  } catch (err) {
    console.error("list-sent error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
