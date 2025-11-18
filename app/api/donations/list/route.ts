// app/api/donations/list/route.ts
import { NextResponse } from "next/server";
import { openDb } from "@/db/db";
import { errorMonitor } from "events";


type StaffListRow = {
  Donation_ID: number;
  Donor_Name: string;
  Category: string;
  Condition_Grade: string | null;
  Description: string;
  Submitted_At: string;
  PhotoUrl?: string | null; // this is to show the image preview
}


//selects the donation details/donor name/category name/ photo from photodonotion table
export async function GET() {
  try {
    const db = await openDb();
    const rows = await db.all<StaffListRow[]>(
      `SELECT
          d.Donation_ID,
          u.Full_Name AS Donor_Name,
          c.Name AS Category,
          d.Condition_Grade,
          d.Description,
          d.Submitted_At,
          pd.Photo_URL AS PhotoUrl
       FROM Donations d
       JOIN Donor dn   ON dn.Donor_ID = d.Donor_ID
       JOIN Users u    ON u.User_ID   = dn.User_ID
       JOIN Categories c ON c.CategoryID = d.Category_ID
       LEFT JOIN PhotoDonation pd ON pd.Donation_ID = d.Donation_ID
       WHERE d.Status = 'Pending'
       ORDER BY d.Submitted_At ASC`,
    );
    return NextResponse.json(rows);
  }
  catch (error) {
    console.error("Donations/Lists error:", error);
    return NextResponse.json({error: "Server Error"}, {status:500}); 
  }
}
