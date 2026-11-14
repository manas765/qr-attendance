import crypto from "crypto";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 403 });

  if (user.role === "faculty") {
    const rows = await sql`
      SELECT c.id, c.code, c.name, c.join_code,
        (SELECT COUNT(*)::int FROM enrollments e WHERE e.course_id = c.id) AS students,
        (SELECT COUNT(*)::int FROM class_sessions s WHERE s.course_id = c.id) AS sessions
      FROM courses c WHERE c.faculty_id = ${user.id} ORDER BY c.created_at DESC`;
    return NextResponse.json(rows);
  }

  const rows = await sql`
    SELECT c.id, c.code, c.name,
      (SELECT COUNT(*)::int FROM class_sessions s
         WHERE s.course_id = c.id AND s.starts_at >= e.joined_at) AS total,
      (SELECT COUNT(*)::int FROM attendance a
         JOIN class_sessions s ON s.id = a.session_id
         WHERE s.course_id = c.id AND a.student_id = ${user.id}) AS attended
    FROM enrollments e JOIN courses c ON c.id = e.course_id
    WHERE e.student_id = ${user.id} ORDER BY c.name`;
  return NextResponse.json(rows);
}

export async function POST(req) {
  const user = await getUser();
  if (!user || user.role !== "faculty")
    return NextResponse.json({ error: "Faculty only" }, { status: 403 });

  const { code, name } = await req.json();
  if (!code?.trim() || !name?.trim())
    return NextResponse.json({ error: "Course code and name required" }, { status: 400 });

  for (let i = 0; i < 5; i++) {
    const joinCode = crypto.randomBytes(3).toString("hex").toUpperCase(); // e.g. A3F09C
    try {
      const [course] = await sql`
        INSERT INTO courses (code, name, faculty_id, join_code)
        VALUES (${code.trim()}, ${name.trim()}, ${user.id}, ${joinCode})
        RETURNING id, code, name, join_code`;
      return NextResponse.json(course);
    } catch {
      /* join code collision, try again */
    }
  }
  return NextResponse.json({ error: "Could not create course" }, { status: 500 });
}