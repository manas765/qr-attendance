import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createToken, cookieOptions } from "@/lib/auth";

export async function POST(req) {
  const { name, email, password, role } = await req.json();
  if (!name || !email || !password || !["faculty", "student"].includes(role))
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  if (password.length < 6)
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

  const hash = await bcrypt.hash(password, 10);
  try {
    const [user] = await sql`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (${name}, ${email.toLowerCase()}, ${hash}, ${role})
      RETURNING id, name, role`;
    const res = NextResponse.json(user);
    res.cookies.set("token", await createToken(user), cookieOptions);
    return res;
  } catch {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }
}