import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function POST(req) {
  const user = await getUser();
  if (!user || user.role !== "student")
    return NextResponse.json({ error: "Students only" }, { status: 403 });

  const { joinCode } = await req.json();
  const [course] = await sql`
    SELECT id, code, name FROM courses WHERE join_code = ${String(joinCode || "").trim().toUpperCase()}`;
  if (!course) return NextResponse.json({ error: "Invalid join code" }, { status: 404 });

  await sql`
    INSERT INTO enrollments (course_id, student_id)
    VALUES (${course.id}, ${user.id}) ON CONFLICT DO NOTHING`;
  return NextResponse.json({ message: `Joined ${course.code} - ${course.name}` });
}