"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

export default function Faculty() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ code: "", name: "" });
  const [minutes, setMinutes] = useState(60);
  const [session, setSession] = useState(null);
  const [token, setToken] = useState("");
  const [count, setCount] = useState(0);
  const [error, setError] = useState("");

  async function loadCourses() {
    const res = await fetch("/api/courses");
    if (res.status === 403) return router.push("/");
    setCourses(await res.json());
  }
  useEffect(() => { loadCourses(); }, []);

  async function createCourse(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    setForm({ code: "", name: "" });
    loadCourses();
  }

  async function startSession(courseId) {
    setError("");
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, minutes }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    setSession(data);
  }

  useEffect(() => {
    if (!session) return;
    const load = async () => {
      const res = await fetch(`/api/sessions/${session.id}/token`);
      if (!res.ok) { setSession(null); setError("Session ended"); return; }
      const data = await res.json();
      setToken(data.token);
      setCount(data.count);
    };
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [session]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <main style={{ maxWidth: 520, margin: "40px auto", padding: 16, fontFamily: "sans-serif" }}>
      <h1>Faculty Dashboard</h1>
      {session ? (
        <div style={{ textAlign: "center" }}>
          <h2>{session.course}</h2>
          {token && <QRCodeSVG value={token} size={280} />}
          <p>QR refreshes every 30 seconds</p>
          <p><b>{count}</b> students marked present</p>
          <button onClick={() => { setSession(null); loadCourses(); }}>Close session</button>
        </div>
      ) : (
        <>
          <h3>Create a course</h3>
          <form onSubmit={createCourse} style={{ display: "grid", gap: 8 }}>
            <input placeholder="Code (e.g. MCA301)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            <input placeholder="Name (e.g. Cloud Computing)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <button type="submit">Add course</button>
          </form>
          {error && <p style={{ color: "crimson" }}>{error}</p>}

          <h3>My courses</h3>
          <label>Session length (minutes):{" "}
            <input type="number" min={5} max={240} value={minutes} onChange={(e) => setMinutes(e.target.value)} style={{ width: 70 }} />
          </label>
          {courses.length === 0 && <p>No courses yet.</p>}
          {courses.map((c) => (
            <div key={c.id} style={{ border: "1px solid #ccc", borderRadius: 8, padding: 12, margin: "10px 0" }}>
              <b>{c.code} - {c.name}</b>
              <p style={{ margin: "4px 0" }}>
                Join code: <code style={{ fontSize: 18 }}>{c.join_code}</code> · {c.students} students · {c.sessions} sessions
              </p>
              <button onClick={() => startSession(c.id)}>Start session</button>{" "}
              <Link href={`/faculty/course/${c.id}`}>View report</Link>
            </div>
          ))}
        </>
      )}
      <p><button onClick={logout}>Logout</button></p>
    </main>
  );
}