"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

export default function Faculty() {
  const router = useRouter();
  const [course, setCourse] = useState("");
  const [minutes, setMinutes] = useState(60);
  const [session, setSession] = useState(null);
  const [token, setToken] = useState("");
  const [count, setCount] = useState(0);
  const [error, setError] = useState("");

  async function start(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course, minutes }),
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
    <main style={{ maxWidth: 420, margin: "40px auto", padding: 16, fontFamily: "sans-serif" }}>
      <h1>Faculty Dashboard</h1>
      {!session ? (
        <form onSubmit={start} style={{ display: "grid", gap: 10 }}>
          <input placeholder="Course (e.g. MCA301 - Cloud)" value={course} onChange={(e) => setCourse(e.target.value)} required />
          <input type="number" min={5} max={240} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          <button type="submit">Start attendance session</button>
          {error && <p style={{ color: "crimson" }}>{error}</p>}
        </form>
      ) : (
        <div style={{ textAlign: "center" }}>
          <h2>{session.course}</h2>
          {token && <QRCodeSVG value={token} size={280} />}
          <p>QR refreshes every 30 seconds</p>
          <p><b>{count}</b> students marked present</p>
          <button onClick={() => setSession(null)}>Close</button>
        </div>
      )}
      <p><button onClick={logout}>Logout</button></p>
    </main>
  );
}