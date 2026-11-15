import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createToken, cookieOptions } from "@/lib/auth";
import { tooMany, hit, clear, clientIp } from "@/lib/ratelimit";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    const mail = String(email || "").trim().toLowerCase();
    const bucket = `login:${clientIp(req)}:${mail}`;

    if (await tooMany(bucket, 5, 900))
      return NextResponse.json({ error: "Too many failed attempts. Try again in 15 minutes." }, { status: 429 });

    let user = (await sql`SELECT * FROM users WHERE email = ${mail}`)[0];
    if (!user || !(await bcrypt.compare(String(password || ""), user.password_hash))) {
      await hit(bucket);
      return NextResponse.json({ error: "Wrong email or password" }, { status: 401 });
    }

    const adminMail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    if (adminMail && mail === adminMail && (user.role !== "admin" || !user.approved))
      user = (await sql`UPDATE users SET role = 'admin', approved = true WHERE id = ${user.id} RETURNING *`)[0];

    if (!user.approved)
      return NextResponse.json({ error: "Your faculty account is waiting for admin approval." }, { status: 403 });

    await clear(bucket);
    const safe = { id: user.id, name: user.name, role: user.role };
    const res = NextResponse.json(safe);
    res.cookies.set("token", await createToken(safe), cookieOptions);
    return res;
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    return NextResponse.json({ error: "Database or server problem. Please try again." }, { status: 500 });
  }
}