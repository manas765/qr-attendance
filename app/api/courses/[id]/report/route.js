import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";

const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;

export async function GET(req, { params }) {
  const { id } = await params;
  const user = await getUser();
  if (!user || user.role !== "faculty")
    return NextResponse.json({ error: "Faculty only" }, { status: 403 });

  const [course] = await sql`
    SELECT id, code, name FROM courses WHERE id = ${id} AND faculty_id = ${user.id}`;
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const students = await sql`
    SELECT u.id, u.name, u.email FROM enrollments e
    JOIN users u ON u.id = e.student_id WHERE e.course_id = ${id} ORDER BY u.name`;
  const sessions = await sql`
    SELECT id, starts_at FROM class_sessions WHERE course_id = ${id} ORDER BY starts_at`;
  const marks = await sql`
    SELECT a.session_id, a.student_id FROM attendance a
    JOIN class_sessions s ON s.id = a.session_id WHERE s.course_id = ${id}`;

  const present = new Set(marks.map((m) => `${m.session_id}:${m.student_id}`));
  const rows = students.map((st) => {
    const attended = sessions.filter((s) => present.has(`${s.id}:${st.id}`)).length;
    return {
      ...st,
      attended,
      percent: sessions.length ? Math.round((attended / sessions.length) * 100) : 0,
      marks: sessions.map((s) => present.has(`${s.id}:${st.id}`)),
    };
  });

  if (new URL(req.url).searchParams.get("format") === "csv") {
    const header = ["Name", "Email", ...sessions.map((s) => new Date(s.starts_at).toLocaleDateString("en-IN")), "Attended", "Percent"];
    const lines = [header.map(esc).join(",")];
    for (const r of rows)
      lines.push([r.name, r.email, ...r.marks.map((m) => (m ? "P" : "A")), r.attended, r.percent + "%"].map(esc).join(","));
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${course.code}-attendance.csv"`,
      },
    });
  }

  return NextResponse.json({ course, totalSessions: sessions.length, students: rows });
}