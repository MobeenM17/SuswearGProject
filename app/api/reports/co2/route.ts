import { NextResponse } from "next/server";
import { openDb } from "@/db/db";

/** Database row types */
type DonorRow = { Donor_ID: number; Full_Name: string; Email: string };
type DonationRow = { Donation_ID: number; Description: string; CategoryName: string };

/** Factors: kg saved per accepted/distributed donation */
const CO2_KG: Record<string, number> = {
  Clothing: 3.0,
  Men: 3.5,
  Women: 3.5,
  Children: 2.0,
  "Coats & Jackets": 12.0,
  Tops: 2.5,
};

const LANDFILL_KG: Record<string, number> = {
  Clothing: 2.5,
  Men: 2.8,
  Women: 2.8,
  Children: 1.5,
  "Coats & Jackets": 10.0,
  Tops: 1.8,
};

const DFLT_CO2 = 3.0;
const DFLT_LF = 2.0;

/**
 * POST handler — generates CO₂ / landfill saved reports
 * (global or per donor)
 */
export async function POST(req: Request) {
  try {
    const { donorEmail } = await req.json().catch(() => ({ donorEmail: null }));
    const isGlobal = !donorEmail;

    const db = await openDb();

    // (A) Get donor row if filtering by donor
    let donorRow: DonorRow | undefined;
    if (!isGlobal) {
      donorRow = (await db.get(
        `
        SELECT dn.Donor_ID, u.Full_Name, u.Email
        FROM Donor dn
        JOIN Users u ON u.User_ID = dn.User_ID
        WHERE LOWER(u.Email) = LOWER(?)
        `,
        [donorEmail]
      )) as DonorRow | undefined;

      if (!donorRow) {
        return NextResponse.json({ error: "Donor not found" }, { status: 404 });
      }
    }

    // (B) Get accepted/distributed donations (global or by donor)
    const donations = (await db.all(
      `
      SELECT d.Donation_ID,
             d.Description,
             c.Name AS CategoryName
      FROM Donations d
      JOIN Categories c ON c.CategoryID = d.Category_ID
      WHERE d.Status IN ('Accepted', 'Distributed')
      ${isGlobal ? "" : "AND d.Donor_ID = ?"}
      ORDER BY d.Submitted_At DESC
      `,
      isGlobal ? [] : [donorRow!.Donor_ID]
    )) as DonationRow[];

    // (C) Calculate CO₂ and landfill savings
    let totalCO2 = 0;
    let landfillSavedKG = 0;
    const perDonation: Array<{
      donationId: number;
      description: string;
      type: string;
      co2Saved: number;
    }> = [];

    for (const d of donations) {
      const type = d.CategoryName || "Clothing";
      const c = CO2_KG[type] ?? DFLT_CO2;
      const l = LANDFILL_KG[type] ?? DFLT_LF;
      totalCO2 += c;
      landfillSavedKG += l;

      if (!isGlobal) {
        perDonation.push({
          donationId: d.Donation_ID,
          description: d.Description,
          type,
          co2Saved: c,
        });
      }
    }

    // (D) Upsert daily metrics — safe with fallback for older SQLite
    if (isGlobal) {
      const today = new Date().toISOString().slice(0, 10);

      try {
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
            donations.length,
            Number(totalCO2.toFixed(1)),
            Number(landfillSavedKG.toFixed(1)),
          ]
        );
      } catch (e) {
        // Fallback for older SQLite builds; keeps request successful
        try {
          await db.run(
            `
            INSERT OR REPLACE INTO Metrics (Metric_Date, Total_Donations, Co2_Saved_KG, Landfill_Saved_KG)
            VALUES (?, ?, ?, ?)
            `,
            [
              today,
              donations.length,
              Number(totalCO2.toFixed(1)),
              Number(landfillSavedKG.toFixed(1)),
            ]
          );
        } catch (inner) {
          console.warn("⚠️ Metrics write skipped:", inner);
        }
      }
    }

    // (E) Final response
    if (isGlobal) {
      return NextResponse.json({
        scope: "all",
        totalDonations: donations.length,
        totalCO2: Number(totalCO2.toFixed(1)),
        landfillSavedKG: Number(landfillSavedKG.toFixed(1)),
      });
    } else {
      return NextResponse.json({
        scope: "donor",
        donor: donorRow!.Full_Name,
        email: donorRow!.Email,
        totalDonations: donations.length,
        totalCO2: Number(totalCO2.toFixed(1)),
        landfillSavedKG: Number(landfillSavedKG.toFixed(1)),
        donations: perDonation,
      });
    }
  } catch (err) {
    console.error("❌ CO₂ report error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
