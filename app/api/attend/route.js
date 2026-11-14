import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { verifyToken } from "@/lib/qr";

export async function POST(req) {
  const user = await getUser();
  if (!user || user.role !== "student")
    return NextResponse.json({ error: "Login as a student first" }, { status: 403 });

  const { token } = await req.json();
  const sessionId = verifyToken(token);
  if (!sessionId)
    return NextResponse.json({ error: "QR expired or invalid. Scan the latest code." }, { status: 400 });

  const [s] = await sql`
    SELECT course, course_id FROM class_sessions WHERE id = ${sessionId} AND ends_at > now()`;
  if (!s) return NextResponse.json({ error: "Session has ended" }, { status: 400 });

  const enrolled = await sql`
    SELECT 1 FROM enrollments WHERE course_id = ${s.course_id} AND student_id = ${user.id}`;
  if (!enrolled.length)
    return NextResponse.json({ error: "You are not enrolled in this course" }, { status: 403 });

  const rows = await sql`
    INSERT INTO attendance (session_id, student_id)
    VALUES (${sessionId}, ${user.id})
    ON CONFLICT DO NOTHING RETURNING id`;
  return NextResponse.json({
    message: rows.length ? `Attendance marked for ${s.course} ✅` : `Already marked for ${s.course}`,
  });
}