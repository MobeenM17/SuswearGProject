
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { openDb } from "@/db/db"; //

// email validation rules 
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// password validation rules - Must have at least 8 characters, one letter, and one number - regex condition
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-={}[\]:;"'<>,.?/`~]{8,}$/;

export async function POST(req: Request) {
  try {
    // reads and gets all data from the frontend request
    const { fullName, email, password } = await req.json();

    // checks to see if all the input fields are filled
    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: "Full name, email, and password are required." },
        { status: 400 }
      );
    }

    // validate the format for the email
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address (example@email.com)." },
        { status: 400 }
      );
    }

    // validate password uses regex condition
    if (!PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters long and contain both letters and numbers.",
        },
        { status: 400 }
      );
    }

    // opens up the database so we can make changes
    const db = await openDb();

    // checks if the email aready exists.
    const existingUser = await db.get(
      `SELECT 1 FROM Users WHERE LOWER(Email) = LOWER(?)`,
      [email]
    );

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // makes the password hashed before saving it into the database for better security Hash
    const hashedPassword = await bcrypt.hash(password, 10);

    // the new registered account will automatically be assigned to donor role.
    await db.run(
      `
      INSERT INTO Users (Full_Name, Email, Password_Hash, User_Role)
      VALUES (?, ?, ?, 'Donor')
      `,
      [fullName.trim(), email.trim(), hashedPassword]
    );

    return NextResponse.json(
      { message: "Registration successful. You can now log in!" },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
