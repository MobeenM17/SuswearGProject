import { NextResponse } from "next/server";
import { openDb } from "@/db/db";

export async function POST(req: Request) {
  try {
    const { donorEmail } = await req.json();
    if (!donorEmail) {
      return NextResponse.json({ error: "Missing donor email" }, { status: 400 });
    }

    const db = await openDb();

    const donor = await db.get(
      `SELECT User_ID, Full_Name, Email FROM Users WHERE LOWER(Email) = LOWER(?) AND User_Role = 'Donor'`,
      [donorEmail]
    );

    if (!donor) {
      return NextResponse.json({ error: "Donor not found" }, { status: 404 });
    }

    const donations = await db.all(
      `
      SELECT D.Donation_ID, D.Description, C.Name AS CategoryName
      FROM Donations D
      JOIN Categories C ON D.Category_ID = C.CategoryID
      WHERE D.Donor_ID = ? AND D.Status = 'Accepted'
      `,
      [donor.User_ID]
    );

    if (!donations || donations.length === 0) {
      return NextResponse.json({ message: "No accepted donations found for this donor", donations: [] });
    }

    const co2Values: Record<string, number> = {
      "T-Shirt": 2.5,
      "Jeans": 10.0,
      "Jacket": 14.0,
      "Dress": 8.0,
      "Shoes": 6.0,
      "Sweater": 5.5,
      "Other": 3.0,
    };

    const report = donations.map(d => {
      const type = d.CategoryName || "Other";
      const co2Saved = co2Values[type] || co2Values["Other"];
      return {
        donationId: d.Donation_ID,
        description: d.Description,
        type,
        co2Saved,
      };
    });

    const totalCO2 = report.reduce((sum, d) => sum + d.co2Saved, 0);

    return NextResponse.json({
      donor: donor.Full_Name,
      email: donor.Email,
      totalCO2,
      donations: report,
    });
  } catch (err) {
    console.error("❌ CO2 report error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
