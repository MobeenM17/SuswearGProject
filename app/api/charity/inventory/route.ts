import { NextResponse } from "next/server";
import { openDb } from "@/db/db";

interface InventoryItem {
  Inventory_ID: number;
  Donation_ID: number;
  Description: string | null;
  WeightKg: number | null;
  Size_Label: string | null;
  Gender_Label: string | null;
  Season_Type: string | null;
  Photo_URLs: string[]; // array of photo URLs
}

interface PhotoRow {
  Photo_URL: string;
}

export async function GET() {
  try {
    const db = await openDb();

    // 1. Get all inventory items
    const items: Omit<InventoryItem, "Photo_URLs">[] = await db.all(`
      SELECT 
        i.Inventory_ID,
        i.Donation_ID,
        d.Description,
        d.WeightKg,
        i.Size_Label,
        i.Gender_Label,
        i.Season_Type
      FROM Inventory i
      JOIN Donations d ON d.Donation_ID = i.Donation_ID
      WHERE i.Status IN ('Arriving', 'InStock')
    `);

    // 2. For each inventory item, fetch all photos
    const itemsWithPhotos: InventoryItem[] = await Promise.all(
      items.map(async (item) => {
        const photos: PhotoRow[] = await db.all(
          `SELECT Photo_URL FROM PhotoDonation WHERE Donation_ID = ?`,
          [item.Donation_ID]
        );

        return {
          ...item,
          Photo_URLs: photos.map((p) => p.Photo_URL), // now properly typed
        };
      })
    );

    return NextResponse.json({ items: itemsWithPhotos });
  } catch (err) {
    console.error("Inventory fetch error:", err);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
