//app/api/donations/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { openDb } from "@/db/db";
import fs from "fs";
import path from "path";

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  try {
    const userIdStr = req.cookies.get("session_user_id")?.value;
    if (!userIdStr) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const userId = Number(userIdStr);
    if (isNaN(userId)) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });

    const formData = await req.formData();
    const description = formData.get("description")?.toString().trim() || "";
    const categoryName = formData.get("categoryId")?.toString().trim() || "";
    const weightStr = formData.get("weightKg")?.toString() || "";
    const weightKg = parseFloat(weightStr);
    const photoFile = formData.get("photo") as File | null;

    if (!description || !categoryName || !weightKg || !photoFile)
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });

    const db = await openDb();

    // --- Get Donor_ID ---
    const donor = await db.get<{ Donor_ID: number }>(
      "SELECT Donor_ID FROM Donor WHERE User_ID = ?",
      [userId]
    );
    if (!donor) return NextResponse.json({ error: "Donor not found" }, { status: 404 });

    // --- Get Category_ID ---
    const category = await db.get<{ CategoryID: number }>(
      "SELECT CategoryID FROM Categories WHERE Name = ?",
      [categoryName]
    );
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    // --- Save photo locally ---
    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const fileName = `${Date.now()}-${photoFile.name}`;
    const filePath = path.join(uploadDir, fileName);
    const arrayBuffer = await photoFile.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
    const photoUrl = `/uploads/${fileName}`; // this is what frontend can use in <Image />

    // --- Insert into Donations ---
    const result = await db.run(
      `INSERT INTO Donations (Donor_ID, Description, Category_ID, WeightKg, Status, Submitted_At)
       VALUES (?, ?, ?, ?, 'Pending', datetime('now'))`,
      [donor.Donor_ID, description, category.CategoryID, weightKg]
    );
    const donationId = result.lastID;

    // --- Insert into PhotoDonation ---
    await db.run(
      `INSERT INTO PhotoDonation (Donation_ID, Photo_URL, Uploaded_At)
       VALUES (?, ?, datetime('now'))`,
      [donationId, photoUrl]
    );

    return NextResponse.json({ message: "Donation submitted successfully" });
  } catch (err: unknown) {
    console.error("Donation create error:", err);
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
