import { NextResponse } from "next/server";
import { openDb } from "@/db/db";

// Define the base structure of an inventory item
type ItemBase = {
  Inventory_ID: number;
  Donation_ID: number;
  Description: string | null;
  WeightKg: number | null;
  Size_Label: string | null;
  Gender_Label: string | null;
  Season_Type: string | null;
  Charity_ID: number | null;
  Charity_Name: string | null;
};

// GET /api/charity/inventory and then return list of inventory items
export async function GET() {
  let dbConn;

  try {
    dbConn = await openDb();

    const rows: ItemBase[] = await dbConn.all(`
      SELECT
        i.Inventory_ID,
        i.Donation_ID,
        d.Description,
        d.WeightKg,
        i.Size_Label,
        i.Gender_Label,
        i.Season_Type,
        i.Charity_ID,
        c.Charity_Name
      FROM Inventory i
        JOIN Donations d ON d.Donation_ID = i.Donation_ID
        LEFT JOIN Charity c ON c.Charity_ID = i.Charity_ID
      WHERE i.Status IN ('Arriving', 'InStock')
    `);// Get all inventory items that are either arriving or in stock from the database tables Donations and Charity which are joined with the Inventory table.

    if (!rows?.length) return NextResponse.json({ items: [] });

    const photoLookup = await dbConn.all(
      `SELECT Donation_ID, Photo_URL FROM PhotoDonation`// Get all photo URLs associated with donation IDs from the PhotoDonation table.
    );

    const photoMap: Record<number, string[]> = {};
    for (const p of photoLookup) {
      if (!photoMap[p.Donation_ID]) photoMap[p.Donation_ID] = [];
      photoMap[p.Donation_ID].push(p.Photo_URL);
    }// Create a mapping of donation IDs to their corresponding photo URLs.

    const out = rows.map((item) => ({
      ...item,
      Photo_URLs: photoMap[item.Donation_ID] || [],
      Charity_Name: item.Charity_Name || "Unknown",
      Charity_ID: item.Charity_ID || null,
    }));// Map each inventory item to include its photo URLs and handle missing charity information.

    return NextResponse.json({ items: out });

  } catch (err) {
    console.warn("Inventory route failed:", err);
    return NextResponse.json({ items: [] }, { status: 500 });
  } finally {
    try { await dbConn?.close(); } catch (_) {}
  }// Ensure the database connection is closed after the operation.
}
