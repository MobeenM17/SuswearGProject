import { NextResponse } from "next/server";
import { openDb } from "@/db/db";

//this is the api route that the charity page uses to get its items
type ItemBase = {
  Inventory_ID: number;
  Donation_ID: number;
  Description: string | null;
  WeightKg: number | null;
  Size_Label: string | null;
  Gender_Label: string | null;
  Season_Type: string | null;
};


export async function GET() { //this is the request handler 
  let dbConn;

  try {
    dbConn = await openDb();

//gets all the items in the db that are either arriving or that could be in stock
    const rows: ItemBase[] = await dbConn.all(` 
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

    //if there isnt an item, it will return an empty array
    if (!rows?.length) {
      return NextResponse.json({ items: [] });
    }

    //gets the the photos for the items
    const photoLookup = await dbConn.all(
      `SELECT Donation_ID, Photo_URL FROM PhotoDonation`
    );

 
    //maps the photos to the items that they are
    const photoMap: Record<number, string[]> = {};
    for (const p of photoLookup) {
      if (!photoMap[p.Donation_ID]) photoMap[p.Donation_ID] = [];
      photoMap[p.Donation_ID].push(p.Photo_URL);
    }


    const out = rows.map((item) => ({
      ...item,
      Photo_URLs: photoMap[item.Donation_ID] || []
    }));

    return NextResponse.json({ items: out });

  } catch (err) {

    //this is just incase something bad happens
    console.warn("Inventory route failed:", err);
    return NextResponse.json({ items: [] }, { status: 500 });

  } finally {

    try {
      await dbConn?.close();
    } catch (_) {}
  }
}
