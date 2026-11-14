import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { makeToken } from "@/lib/qr";

export async function GET(_req, { params }) {
  const { id } = await params;
  const user = await getUser();
  if (!user || user.role !== "faculty")
    return NextResponse.json({ error: "Faculty only" }, { status: 403 });

  const [s] = await sql`
    SELECT id, course, ends_at FROM class_sessions
    WHERE id = ${id} AND faculty_id = ${user.id} AND ends_at > now()`;
  if (!s) return NextResponse.json({ error: "Session not found or ended" }, { status: 404 });

  const attendees = await sql`
    SELECT u.name, a.marked_at FROM attendance a
    JOIN users u ON u.id = a.student_id
    WHERE a.session_id = ${id} ORDER BY a.marked_at DESC LIMIT 30`;
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM attendance WHERE session_id = ${id}`;

  return NextResponse.json({
    token: makeToken(s.id), count, attendees, course: s.course, endsAt: s.ends_at,
  });
}