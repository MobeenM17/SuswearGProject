// Returns a list of donors for the Admin report page.
import { NextResponse } from "next/server";
import { openDb } from "@/db/db";

export async function GET() {
  try {

    const db = await openDb();

    //Pull donors only (role = 'Donor') and is ordered by name so it looks tidy
   
    const rows: Array<{ User_ID: number; Full_Name: string; Email: string }> =
      (await db.all(
        `
        SELECT User_ID, Full_Name, Email
        FROM Users
        WHERE User_Role = 'Donor'
        ORDER BY Full_Name ASC 
        `
      )) || [];

    // returns it back to the client
    return NextResponse.json(rows, { status: 200 });
  } catch (err) {
    console.error("get '/api/users/donors' error:", err);
    return NextResponse.json({ error: "There was an error in loading in the donors" }, { status: 500 });
  }
}
