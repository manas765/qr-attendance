import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";

async function adminOnly() {
  const user = await getUser();
  return user && user.role === "admin" ? user : null;
}

export async function POST(req, { params }) {
  const { id } = await params;
  if (!(await adminOnly())) return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const { action } = await req.json();
  if (!["approve", "revoke"].includes(action))
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  await sql`
    UPDATE users SET approved = ${action === "approve"}
    WHERE id = ${id} AND role = 'faculty'`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req, { params }) {
  const { id } = await params;
  if (!(await adminOnly())) return NextResponse.json({ error: "Admin only" }, { status: 403 });
  try {
    const [t] = await sql`SELECT id, role FROM users WHERE id = ${id}`;
    if (!t) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (t.role === "admin")
      return NextResponse.json({ error: "Admin accounts can't be removed here" }, { status: 400 });
    if (t.role === "faculty") {
      const [{ n }] = await sql`
        SELECT ((SELECT COUNT(*) FROM courses WHERE faculty_id = ${id}) +
                (SELECT COUNT(*) FROM class_sessions WHERE faculty_id = ${id}))::int AS n`;
      if (n > 0)
        return NextResponse.json({ error: "This faculty still has courses or sessions. Remove those first." }, { status: 400 });
    }
    await sql`DELETE FROM attendance WHERE student_id = ${id}`;
    await sql`DELETE FROM enrollments WHERE student_id = ${id}`;
    await sql`DELETE FROM users WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE USER ERROR:", e);
    return NextResponse.json({ error: "Could not remove this user" }, { status: 500 });
  }
}