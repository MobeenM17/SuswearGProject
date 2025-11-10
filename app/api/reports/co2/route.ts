import { NextResponse } from "next/server";
import { openDb } from "@/db/db";

// --- CO₂ and Landfill factors by category ---
const CO2_KG_BY_CATEGORY: Record<string, number> = {
  "Clothing": 3.0,
  "Men": 3.5,
  "Women": 3.5,
  "Children": 2.0,
  "Coats & Jackets": 12.0,
  "Tops": 2.5,
};

const LANDFILL_KG_BY_CATEGORY: Record<string, number> = {
  "Clothing": 2.5,
  "Men": 2.8,
  "Women": 2.8,
  "Children": 1.5,
  "Coats & Jackets": 10.0,
  "Tops": 1.8,
};

const DEFAULT_CO2 = 3.0;
const DEFAULT_LANDFILL = 2.0;

// ======================================================
export async function POST(req: Request) {
  try {
    // 1️⃣ Read donor email from frontend (null = global)
    const body = await req.json().catch(() => ({}));
    const donorEmail: string | null = body.donorEmail || null;
    const isGlobal = !donorEmail;

    // 2️⃣ Open DB
    const db = await openDb();

    // 3️⃣ If per-donor, validate donor exists
    let donorUser: { User_ID: number; Full_Name: string; Email: string } | null = null;

    if (!isGlobal) {
      const result = await db.get<{
        User_ID: number;
        Full_Name: string;
        Email: string;
      }>(
        `SELECT User_ID, Full_Name, Email
         FROM Users
         WHERE LOWER(Email) = LOWER(?) AND User_Role = 'Donor'`,
        [donorEmail]
      );

      donorUser = result || null; // explicitly allow null

      if (!donorUser) {
        return NextResponse.json({ error: "Donor not found" }, { status: 404 });
      }
    }

    // 4️⃣ Get accepted donations
    const donations: Array<{ Donation_ID: number; Description: string; CategoryName: string }> =
      (await db.all(
        `
        SELECT d.Donation_ID,
               d.Description,
               c.Name AS CategoryName
        FROM Donations d
        JOIN Categories c ON d.Category_ID = c.CategoryID
        WHERE d.Status = 'Accepted'
        ${isGlobal ? "" : "AND d.Donor_ID = ?"}
        ORDER BY d.Submitted_At DESC
        `,
        isGlobal ? [] : [donorUser!.User_ID]
      )) || [];

    // 5️⃣ Calculate totals
    let totalCO2 = 0;
    let landfillSavedKG = 0;
    const perDonation: {
      donationId: number;
      description: string;
      type: string;
      co2Saved: number;
    }[] = [];

    for (const d of donations) {
      const type = d.CategoryName || "Clothing";
      const co2 = CO2_KG_BY_CATEGORY[type] ?? DEFAULT_CO2;
      const landfill = LANDFILL_KG_BY_CATEGORY[type] ?? DEFAULT_LANDFILL;

      totalCO2 += co2;
      landfillSavedKG += landfill;

      if (!isGlobal) {
        perDonation.push({
          donationId: d.Donation_ID,
          description: d.Description,
          type,
          co2Saved: co2,
        });
      }
    }

    const totalDonations = donations.length; // ✅ fixed: now always an array

    // 6️⃣ Update metrics if global
    if (isGlobal) {
      const today = new Date().toISOString().slice(0, 10);

      await db.run(
        `
        INSERT INTO Metrics (Metric_Date, Total_Donations, Co2_Saved_KG, Landfill_Saved_KG)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(Metric_Date) DO UPDATE SET
          Total_Donations   = excluded.Total_Donations,
          Co2_Saved_KG      = excluded.Co2_Saved_KG,
          Landfill_Saved_KG = excluded.Landfill_Saved_KG
        `,
        [
          today,
          totalDonations,
          Number(totalCO2.toFixed(1)),
          Number(landfillSavedKG.toFixed(1)),
        ]
      );
    }

    // 7️⃣ Return data
    if (isGlobal) {
      // Global summary
      return NextResponse.json({
        scope: "all",
        totalDonations,
        totalCO2: Number(totalCO2.toFixed(1)),
        landfillSavedKG: Number(landfillSavedKG.toFixed(1)),
      });
    } else {
      // Per-donor summary
      return NextResponse.json({
        scope: "donor",
        donor: donorUser!.Full_Name,
        email: donorUser!.Email,
        totalDonations,
        totalCO2: Number(totalCO2.toFixed(1)),
        landfillSavedKG: Number(landfillSavedKG.toFixed(1)),
        donations: perDonation,
      });
    }
  } catch (err) {
    console.error("❌ CO2 report error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
