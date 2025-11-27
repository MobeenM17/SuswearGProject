import { NextResponse } from "next/server";
import { openDb } from "@/db/db";

// Basic shape for donation rows
interface Donation {
  Donation_ID: number;
  Description: string;
  Category: string;
  WeightKg: number;
  Status: string;
  Submitted_At: string;
  PhotoUrl?: string | null;
}

export async function GET(req: Request) {
  try {
    const cookies = req.headers.get("cookie") ?? "";

    // Quick + sloppy cookie grab (dev-style)
    const raw = cookies.match(/session_user_id=([^;]+)/);
    if (!raw)
      return NextResponse.json(
        { error: "No session info" },
        { status: 401 }
      );

    const userId = Number(raw[1]);
    if (!userId)
      return NextResponse.json(
        { error: "Bad session value" },
        { status: 400 }
      );

    const db = await openDb();

    // find donor for this user
    const donor = await db.get<{ Donor_ID: number }>(
      "select Donor_ID from Donor where User_ID = ?",
      [userId]
    );

    if (!donor)
      return NextResponse.json(
        { error: "Donor record missing" },
        { status: 404 }
      );

    // fetch donations (with optional photo)
    const donations = await db.all<Donation>(
      `
      select 
        d.Donation_ID,
        d.Description,
        c.Name as Category,
        d.WeightKg,
        d.Status,
        d.Submitted_At,
        pd.Photo_URL as PhotoUrl
      from Donations d
      join Categories c on c.CategoryID = d.Category_ID
      left join PhotoDonation pd on pd.Donation_ID = d.Donation_ID
      where d.Donor_ID = ?
      order by d.Submitted_At desc
      `,
      [donor.Donor_ID]
    );

    return NextResponse.json(donations);
  } catch (err) {
    console.error("donor-list err:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
