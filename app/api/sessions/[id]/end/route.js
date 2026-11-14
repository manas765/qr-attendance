import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function POST(_req, { params }) {
  const { id } = await params;
  const user = await getUser();
  if (!user || user.role !== "faculty")
    return NextResponse.json({ error: "Faculty only" }, { status: 403 });
  await sql`
    UPDATE class_sessions SET ends_at = now()
    WHERE id = ${id} AND faculty_id = ${user.id} AND ends_at > now()`;
  return NextResponse.json({ ok: true });
}