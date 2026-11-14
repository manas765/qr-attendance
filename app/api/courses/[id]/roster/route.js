import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";

async function ownSession(id, userId) {
  const [s] = await sql`
    SELECT id, course_id FROM class_sessions WHERE id = ${id} AND faculty_id = ${userId}`;
  return s;
}

export async function GET(_req, { params }) {
  const { id } = await params;
  const user = await getUser();
  if (!user || user.role !== "faculty")
    return NextResponse.json({ error: "Faculty only" }, { status: 403 });
  const s = await ownSession(id, user.id);
  if (!s) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const rows = await sql`
    SELECT u.id, u.name, u.email, (a.id IS NOT NULL) AS present, a.flagged, a.method, a.distance_m
    FROM enrollments e
    JOIN users u ON u.id = e.student_id
    LEFT JOIN attendance a ON a.session_id = ${id} AND a.student_id = u.id
    WHERE e.course_id = ${s.course_id} ORDER BY u.name`;
  return NextResponse.json(rows);
}

export async function POST(req, { params }) {
  const { id } = await params;
  const user = await getUser();
  if (!user || user.role !== "faculty")
    return NextResponse.json({ error: "Faculty only" }, { status: 403 });
  const s = await ownSession(id, user.id);
  if (!s) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const { studentId, present } = await req.json();
  const enrolled = await sql`
    SELECT 1 FROM enrollments WHERE course_id = ${s.course_id} AND student_id = ${studentId}`;
  if (!enrolled.length) return NextResponse.json({ error: "Student not enrolled" }, { status: 400 });

  if (present) {
    await sql`
      INSERT INTO attendance (session_id, student_id, method)
      VALUES (${id}, ${studentId}, 'manual') ON CONFLICT DO NOTHING`;
  } else {
    await sql`DELETE FROM attendance WHERE session_id = ${id} AND student_id = ${studentId}`;
  }
  return NextResponse.json({ ok: true });
}