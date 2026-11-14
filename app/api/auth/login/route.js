import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createToken, cookieOptions } from "@/lib/auth";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    const [user] = await sql`SELECT * FROM users WHERE email = ${String(email).toLowerCase()}`;
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return NextResponse.json({ error: "Wrong email or password" }, { status: 401 });

    const safe = { id: user.id, name: user.name, role: user.role };
    const res = NextResponse.json(safe);
    res.cookies.set("token", await createToken(safe), cookieOptions);
    return res;
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    return NextResponse.json({ error: "Database or server problem. Please try again." }, { status: 500 });
  }
}