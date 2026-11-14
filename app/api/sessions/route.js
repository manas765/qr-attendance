import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function POST(req) {
  const user = await getUser();
  if (!user || user.role !== "faculty")
    return NextResponse.json({ error: "Faculty only" }, { status: 403 });

  const { course, minutes } = await req.json();
  const mins = Math.min(Math.max(parseInt(minutes) || 60, 5), 240);
  if (!course) return NextResponse.json({ error: "Course required" }, { status: 400 });

  const [session] = await sql`
    INSERT INTO class_sessions (faculty_id, course, ends_at)
    VALUES (${user.id}, ${course}, now() + make_interval(mins => ${mins}::int))
    RETURNING id, course, ends_at`;
  return NextResponse.json(session);
}