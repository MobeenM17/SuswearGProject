import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { openDb } from "@/db/db";

// quick password check helper (legacy + hashed)
async function checkPass(entered: string, stored: string) {
  if (!stored) return false;

  // old accounts stored plain text
  if (!stored.startsWith("$")) {
    return entered === stored;
  }

  return bcrypt.compare(entered, stored);
}

// cookie setup for session
function setSession(res: NextResponse, role: string, uid: number) {
  const opts = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 86400,
    secure: process.env.NODE_ENV === "production"
  };

  res.cookies.set("session_role", role, opts);
  res.cookies.set("session_user_id", String(uid), opts);
  return res;
}

export async function POST(req: NextRequest) {
  let data;

  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const { email, password } = data || {};

  // basic input check
  if (!email || !password) {
    return NextResponse.json(
      { error: "Missing email or password" },
      { status: 400 }
    );
  }

  try {
    const db = await openDb();
    const lowerEmail = email.toLowerCase();

    // try staff/admin accounts first
    const staff = await db.get<{
      User_ID: number;
      Full_Name: string;
      Email: string;
      User_Role: string;
      Password_Hash: string;
    }>(
      `SELECT User_ID, Full_Name, Email, User_Role, Password_Hash
       FROM Users
       WHERE LOWER(Email)=?`,
      [lowerEmail]
    );

    if (staff) {
      const ok = await checkPass(password, staff.Password_Hash);
      if (!ok) {
        return NextResponse.json(
          { error: "Incorrect credentials" },
          { status: 401 }
        );
      }

      const res = NextResponse.json({
        message: "Logged in",
        user: {
          User_ID: staff.User_ID,
          Full_Name: staff.Full_Name,
          Email: staff.Email,
          User_Role: staff.User_Role
        }
      });

      return setSession(res, staff.User_Role, staff.User_ID);
    }

    // donor fallback
    const donor = await db.get<{
      Donor_ID: number;
      User_ID: number;
      Full_Name: string;
      Email: string;
      Password_Hash: string;
    }>(
      `SELECT Donor_ID, User_ID, Full_Name, Email, Password_Hash
       FROM Donor
       WHERE LOWER(Email)=?`,
      [lowerEmail]
    );

    if (donor) {
      const ok = await checkPass(password, donor.Password_Hash);
      if (!ok) {
        return NextResponse.json(
          { error: "Incorrect credentials" },
          { status: 401 }
        );
      }

      const res = NextResponse.json({
        message: "Logged in",
        user: {
          User_ID: donor.User_ID,
          Full_Name: donor.Full_Name,
          Email: donor.Email,
          User_Role: "Donor"
        }
      });

      return setSession(res, "Donor", donor.User_ID);
    }

    // no matching account
    return NextResponse.json(
      { error: "Account not found" },
      { status: 404 }
    );
  } catch (err) {
    console.error("LOGIN_ERR:", err); // basic log
    return NextResponse.json(
      { error: "Server issue" },
      { status: 500 }
    );
  }
}
