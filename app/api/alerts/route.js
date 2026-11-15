import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user || user.role !== "faculty")
    return NextResponse.json({ error: "Faculty only" }, { status: 403 });

  const rows = await sql`
    SELECT c.id AS course_id, c.code, c.name AS course_name, u.id, u.name, u.email,
      (SELECT COUNT(*)::int FROM class_sessions s
         WHERE s.course_id = c.id AND s.starts_at >= e.joined_at) AS total,
      (SELECT COUNT(*)::int FROM attendance a JOIN class_sessions s ON s.id = a.session_id
         WHERE s.course_id = c.id AND a.student_id = u.id) AS attended
    FROM courses c
    JOIN enrollments e ON e.course_id = c.id
    JOIN users u ON u.id = e.student_id
    WHERE c.faculty_id = ${user.id}`;

  const low = rows
    .filter((r) => r.total > 0 && r.attended / r.total < 0.75)
    .map((r) => ({ ...r, percent: Math.round((r.attended / r.total) * 100) }))
    .sort((a, b) => a.percent - b.percent);
  return NextResponse.json(low);
}