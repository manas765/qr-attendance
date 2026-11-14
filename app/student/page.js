"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function Student() {
  const router = useRouter();
  const [msg, setMsg] = useState("Point your camera at the class QR code");
  const [courses, setCourses] = useState([]);
  const [joinCode, setJoinCode] = useState("");
  const [joinMsg, setJoinMsg] = useState("");
  const busy = useRef(false);

  async function loadCourses() {
    const res = await fetch("/api/courses");
    if (res.status === 403) return router.push("/");
    setCourses(await res.json());
  }
  useEffect(() => { loadCourses(); }, []);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
    scanner.render(async (text) => {
      if (busy.current) return;
      busy.current = true;
      const res = await fetch("/api/attend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: text }),
      });
      const data = await res.json().catch(() => ({ error: "Server error" }));
      setMsg(data.message || data.error);
      loadCourses();
      setTimeout(() => (busy.current = false), 3000);
    }, () => {});
    return () => { scanner.clear().catch(() => {}); };
  }, []);

  async function join(e) {
    e.preventDefault();
    const res = await fetch("/api/courses/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ joinCode }),
    });
    const data = await res.json();
    setJoinMsg(data.message || data.error);
    if (res.ok) { setJoinCode(""); loadCourses(); }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <main style={{ maxWidth: 440, margin: "40px auto", padding: 16, fontFamily: "sans-serif" }}>
      <h1>Student</h1>

      <h3>Join a course</h3>
      <form onSubmit={join} style={{ display: "flex", gap: 8 }}>
        <input placeholder="Join code" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} required />
        <button type="submit">Join</button>
      </form>
      {joinMsg && <p>{joinMsg}</p>}

      <h3>My attendance</h3>
      {courses.length === 0 && <p>You haven't joined any course yet.</p>}
      {courses.map((c) => {
        const pct = c.total ? Math.round((c.attended / c.total) * 100) : 0;
        return (
          <div key={c.id} style={{ border: "1px solid #ccc", borderRadius: 8, padding: 10, margin: "8px 0" }}>
            <b>{c.code} - {c.name}</b>
            <div>{c.attended}/{c.total} classes ·{" "}
              <b style={{ color: pct < 75 ? "crimson" : "green" }}>{pct}%</b>
            </div>
          </div>
        );
      })}

      <h3>Mark attendance</h3>
      <div id="reader" />
      <p><b>{msg}</b></p>
      <button onClick={logout}>Logout</button>
    </main>
  );
}