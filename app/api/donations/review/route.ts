//app/api/donations/review/route.ts
import { NextRequest, NextResponse } from "next/server";
import { openDb } from "@/db/db";


// Staff reviews a donation:
export async function PUT(req: NextRequest) {
  try {
    // session cookies (auth) 
    const role = req.cookies.get("session_role")?.value; // assigns session role from user logged in account - role
    const staffUserId = Number(req.cookies.get("session_user_id")?.value || 0); // assigns session user id from user logged in account - user id from database

    //if the role doesnt = staff + user id isnt a staff id - it gives them an error message of them being unauthorized
    if (role !== "Staff" || !staffUserId) 
    {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // reads the payload
    const body = await req.json();
    const donationId: number = Number(body?.donationId);
    const action: "accept" | "reject" = body?.action;
    const notes: string | undefined = body?.reason ?? undefined;

    
    const sizeLabel: string | undefined = body?.sizeLabel ?? undefined;
    const genderLabel: string | undefined = body?.genderLabel ?? undefined;
    const seasonType: string | undefined = body?.seasonType ?? undefined;
    const conditionGrade: string | undefined = body?.conditionGrade ?? undefined;


    //checks to see if staff memeber select an donation id and an actions 
    if (!donationId || !action) {
      return NextResponse.json(
        { error: "Donation ID and an Action is required." }, // print error if user does not select an action and donation id
        { status: 400 }
      );
    }

  const db = await openDb();

// Update donation status
     const newStatus = action === "accept" ? "Accepted" : "Rejected"; // the different type of actions

     await db.run(
       `UPDATE Donations SET Status = ?, Submitted_At = Submitted_At WHERE Donation_ID = ?`, // updates the status inside of the database
       [newStatus, donationId]
     );


     await db.run(
       `UPDATE Donations SET Condition_Grade = COALESCE(?, Condition_Grade) WHERE Donation_ID = ?`, //updates the condition grade as i forgot to add this before.
       [conditionGrade ?? null, donationId]
     );


     if (newStatus === "Accepted") { //it creates a tracking order from a random number generator 
       const trackingNumber =
         "TRK-" + Math.floor(1000000000 + Math.random() * 9000000000); //random number generater for tracking number id

       await db.run(
         `UPDATE Donations SET Tracking = ? WHERE Donation_ID = ?`,
         [trackingNumber, donationId]
       );
     }


    // Insert a review 
    await db.run(
      `INSERT INTO Reviews (Donation_ID, Staff_ID, Decision, Notes, Uploaded_At)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [donationId, staffUserId, newStatus, notes ?? null]
    );

    // accepted- create/keep inventory row 
    if (newStatus === "Accepted") {
      await db.run(
        `INSERT OR IGNORE INTO Inventory
           (Donation_ID, Size_Label, Gender_Label, Season_Type, Status, Updated_At)
         VALUES (?, ?, ?, ?, 'Arriving', datetime('now'))`,
        [
          donationId,
          sizeLabel ?? null,
          genderLabel ?? null,
          seasonType ?? null,
        ]
      );

      // inventory already existed it updates labels & timestamp.
      await db.run(
        `UPDATE Inventory
           SET Size_Label = COALESCE(?, Size_Label),
               Gender_Label = COALESCE(?, Gender_Label),
               Season_Type = COALESCE(?, Season_Type),
               Status = 'Arriving',
               Updated_At = datetime('now')
         WHERE Donation_ID = ?`, /* ? is used so i can store it at the end when adding values*/
        [sizeLabel ?? null, genderLabel ?? null, seasonType ?? null, donationId]
      );
    }

    // Create a notification for the donor 
    // Find the donor's User_ID from the Donation.
    const donorUser = await db.get<{ User_ID: number }>(
      `SELECT u.User_ID
         FROM Donations d
         JOIN Donor dn   ON dn.Donor_ID = d.Donor_ID
         JOIN Users u    ON u.User_ID   = dn.User_ID
       WHERE d.Donation_ID = ?`, /* ? is used so i can store it at the end when adding values*/
      [donationId]
    );

    if (donorUser?.User_ID) { //inserts the new input data into the database for notifications
      await db.run(
        `INSERT INTO Notifications (User_ID, Donation_ID, Status, Generated_At)
         VALUES (?, ?, ?, datetime('now'))`,
        [donorUser.User_ID, donationId, newStatus] //assigns the input data to the values of each notification table row
      );
    }

    return NextResponse.json({ ok: true, status: newStatus });
  } 
  catch (err) //catches any debug error it finds // stops it from crashing the program
  {
    console.error("Review error code:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 }); //if there an error with the server prints out this message
  }
}
