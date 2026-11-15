import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const users = await sql`
    SELECT id, name, email, role, approved, created_at FROM users ORDER BY created_at DESC`;
  const courses = await sql`
    SELECT c.id, c.code, c.name, u.name AS faculty,
      (SELECT COUNT(*)::int FROM enrollments e WHERE e.course_id = c.id) AS students,
      (SELECT COUNT(*)::int FROM class_sessions s WHERE s.course_id = c.id) AS sessions
    FROM courses c JOIN users u ON u.id = c.faculty_id ORDER BY c.created_at DESC`;
  const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM attendance`;
  return NextResponse.json({ users, courses, marks: n });
}