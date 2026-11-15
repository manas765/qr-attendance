import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { verifyToken } from "@/lib/qr";
import { metres } from "@/lib/geo";
import { tooMany, hit } from "@/lib/ratelimit";

export async function POST(req) {
  const user = await getUser();
  if (!user || user.role !== "student")
    return NextResponse.json({ error: "Login as a student first" }, { status: 403 });

  if (await tooMany(`attend:${user.id}`, 30, 60))
    return NextResponse.json({ error: "Too many scan attempts. Wait a minute and try again." }, { status: 429 });
  await hit(`attend:${user.id}`);

  const { token, lat, lng, accuracy, deviceId } = await req.json();
  const sessionId = verifyToken(token);
  if (!sessionId)
    return NextResponse.json({ error: "QR expired or invalid. Scan the latest code." }, { status: 400 });

  const [s] = await sql`
    SELECT course, course_id, lat, lng, radius_m FROM class_sessions
    WHERE id = ${sessionId} AND ends_at > now()`;
  if (!s) return NextResponse.json({ error: "Session has ended" }, { status: 400 });

  const enrolled = await sql`
    SELECT 1 FROM enrollments WHERE course_id = ${s.course_id} AND student_id = ${user.id}`;
  if (!enrolled.length)
    return NextResponse.json({ error: "You are not enrolled in this course" }, { status: 403 });

  let dist = null;
  if (s.lat != null) {
    if (typeof lat !== "number" || typeof lng !== "number")
      return NextResponse.json({ error: "Location required. Allow location access and scan again." }, { status: 400 });
    dist = Math.round(metres(s.lat, s.lng, lat, lng));
    const allowed = s.radius_m + Math.min(Number(accuracy) || 0, 50);
    if (dist > allowed)
      return NextResponse.json({ error: `You seem to be ${dist} m from the classroom. Move closer and try again.` }, { status: 403 });
  }

  const dev = typeof deviceId === "string" ? deviceId.slice(0, 64) : null;
  let flagged = false;
  if (dev) {
    const other = await sql`
      SELECT id FROM attendance
      WHERE session_id = ${sessionId} AND device_id = ${dev} AND student_id <> ${user.id}`;
    if (other.length) {
      flagged = true;
      await sql`UPDATE attendance SET flagged = true WHERE session_id = ${sessionId} AND device_id = ${dev}`;
    }
  }

  const rows = await sql`
    INSERT INTO attendance (session_id, student_id, device_id, distance_m, flagged)
    VALUES (${sessionId}, ${user.id}, ${dev}, ${dist}, ${flagged})
    ON CONFLICT DO NOTHING RETURNING id`;
  return NextResponse.json({
    message: rows.length ? `Attendance marked for ${s.course}` : `Already marked for ${s.course}`,
  });
}