import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET(_req, { params }) {
  const { id } = await params;
  const user = await getUser();
  if (!user || user.role !== "faculty")
    return NextResponse.json({ error: "Faculty only" }, { status: 403 });

  const [course] = await sql`
    SELECT id, code, name FROM courses WHERE id = ${id} AND faculty_id = ${user.id}`;
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const sessions = await sql`
    SELECT s.id, s.starts_at, (s.lat IS NOT NULL) AS geo,
      (SELECT COUNT(*)::int FROM attendance a WHERE a.session_id = s.id) AS present,
      (SELECT COUNT(*)::int FROM attendance a WHERE a.session_id = s.id AND a.flagged) AS flagged
    FROM class_sessions s WHERE s.course_id = ${id} ORDER BY s.starts_at DESC`;
  const [{ total }] = await sql`SELECT COUNT(*)::int AS total FROM enrollments WHERE course_id = ${id}`;
  return NextResponse.json({ course, total, sessions });
}