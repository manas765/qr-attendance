"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function Student() {
  const router = useRouter();
  const [msg, setMsg] = useState("Point your camera at the class QR code");
  const busy = useRef(false);

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
      const data = await res.json();
      setMsg(data.message || data.error);
      setTimeout(() => (busy.current = false), 3000);
    }, () => {});
    return () => { scanner.clear().catch(() => {}); };
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <main style={{ maxWidth: 420, margin: "40px auto", padding: 16, fontFamily: "sans-serif" }}>
      <h1>Mark Attendance</h1>
      <div id="reader" />
      <p><b>{msg}</b></p>
      <button onClick={logout}>Logout</button>
    </main>
  );
}