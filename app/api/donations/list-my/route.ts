import { NextResponse } from "next/server";
import { openDb } from "@/db/db";

interface Donation {
  Donation_ID: number;
  Description: string;
  Category: string;
  WeightKg: number;
  Status: string;
  Submitted_At: string;
  PhotoUrl?: string;
}

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const donorCookie = cookieHeader.split(";").find((c) => c.trim().startsWith("session_user_id="));
    if (!donorCookie) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const userId = parseInt(donorCookie.split("=")[1]);
    if (isNaN(userId)) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });

    const db = await openDb();

    // --- Get Donor_ID ---
    const donor = await db.get<{ Donor_ID: number }>(
      "SELECT Donor_ID FROM Donor WHERE User_ID = ?",
      [userId]
    );
    if (!donor) return NextResponse.json({ error: "Donor not found" }, { status: 404 });

    // --- Get Donations with Photo URL ---
    const donations = await db.all<Donation[]>(
      `SELECT d.Donation_ID, d.Description, c.Name AS Category, d.WeightKg, d.Status,
              d.Submitted_At, pd.Photo_URL AS PhotoUrl
       FROM Donations d
       JOIN Categories c ON c.CategoryID = d.Category_ID
       LEFT JOIN PhotoDonation pd ON pd.Donation_ID = d.Donation_ID
       WHERE d.Donor_ID = ?
       ORDER BY d.Submitted_At DESC`,
      [donor.Donor_ID]
    );

    return NextResponse.json(donations);
  } catch (err) {
    console.error("list-my error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
