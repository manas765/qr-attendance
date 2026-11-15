import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createToken, cookieOptions } from "@/lib/auth";
import { tooMany, hit, clientIp } from "@/lib/ratelimit";

export async function POST(req) {
  try {
    const ip = clientIp(req);
    if (await tooMany(`register:${ip}`, 10, 3600))
      return NextResponse.json({ error: "Too many sign-ups from this network. Try again later." }, { status: 429 });
    await hit(`register:${ip}`);

    const { name, email, password, role } = await req.json();
    const mail = String(email || "").trim().toLowerCase();
    if (!name?.trim() || !mail || !password || !["faculty", "student"].includes(role))
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    if (password.length < 6)
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    const adminMail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const finalRole = adminMail && mail === adminMail ? "admin" : role;
    const approved = finalRole !== "faculty";
    const hash = await bcrypt.hash(password, 10);

    let user;
    try {
      const rows = await sql`
        INSERT INTO users (name, email, password_hash, role, approved)
        VALUES (${name.trim()}, ${mail}, ${hash}, ${finalRole}, ${approved})
        RETURNING id, name, role`;
      user = rows[0];
    } catch {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    if (!approved)
      return NextResponse.json({ pending: true, message: "Account created. An admin must approve it before you can sign in." });

    const res = NextResponse.json(user);
    res.cookies.set("token", await createToken(user), cookieOptions);
    return res;
  } catch (e) {
    console.error("REGISTER ERROR:", e);
    return NextResponse.json({ error: "Server problem. Please try again." }, { status: 500 });
  }
}