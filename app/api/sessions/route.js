import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function POST(req) {
  const user = await getUser();
  if (!user || user.role !== "faculty")
    return NextResponse.json({ error: "Faculty only" }, { status: 403 });

  const { courseId, minutes } = await req.json();
  const mins = Math.min(Math.max(parseInt(minutes) || 60, 5), 240);

  const [course] = await sql`
    SELECT id, code, name FROM courses WHERE id = ${courseId} AND faculty_id = ${user.id}`;
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const [session] = await sql`
    INSERT INTO class_sessions (faculty_id, course_id, course, ends_at)
    VALUES (${user.id}, ${course.id}, ${course.code + " - " + course.name},
            now() + make_interval(mins => ${mins}::int))
    RETURNING id, course, ends_at`;
  return NextResponse.json(session);
}