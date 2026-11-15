import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { tooMany, hit, clear } from "@/lib/ratelimit";

export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 403 });

  const { current, next } = await req.json();
  if (!next || String(next).length < 6)
    return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });

  const bucket = `pw:${user.id}`;
  if (await tooMany(bucket, 5, 900))
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });

  const [row] = await sql`SELECT password_hash FROM users WHERE id = ${user.id}`;
  if (!row || !(await bcrypt.compare(String(current || ""), row.password_hash))) {
    await hit(bucket);
    return NextResponse.json({ error: "Current password is wrong" }, { status: 401 });
  }

  const hash = await bcrypt.hash(String(next), 10);
  await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${user.id}`;
  await clear(bucket);
  return NextResponse.json({ ok: true });
}