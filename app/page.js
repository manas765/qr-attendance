"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icons";
import { useToast } from "@/components/Toast";

export default function Home() {
  const router = useRouter();
  const toast = useToast();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student", inviteCode: "" });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((u) => {
      if (u) router.replace(u.role === "faculty" ? "/faculty" : "/student");
    }).catch(() => {});
  }, [router]);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({ error: "Server error" }));
      if (!res.ok) return toast(data.error, "error");
      router.push(data.role === "faculty" ? "/faculty" : "/student");
    } finally {
      setLoading(false);
    }
  }

  const features = [
    ["qr", "i1", "Rotating QR codes", "A new code every 30 seconds, so screenshots are useless."],
    ["shield", "i2", "Proxy-proof", "Only enrolled students can mark attendance, once per class."],
    ["chart", "i4", "Live reports", "Instant percentages, risk alerts and CSV export."],
  ];

  return (
    <div className="auth">
      <section className="hero">
        <div className="brand"><span className="logo"><Icon name="qr" size={18} /></span> QR Attendance</div>
        <h1>Attendance that <span className="grad">can't be faked.</span></h1>
        <p className="muted" style={{ fontSize: "1.1rem", maxWidth: 460 }}>
          Faculty project a live QR. Students scan it. Done in seconds, with every record verified.
        </p>
        <div className="stack">
          {features.map(([ic, cls, t, d]) => (
            <div className="feat" key={t}>
              <span className={`ico ${cls}`}><Icon name={ic} /></span>
              <div><b>{t}</b><div className="muted small">{d}</div></div>
            </div>
          ))}
        </div>
      </section>

      <section className="auth-side">
        <div className="card auth-card">
          <div className="brand mobile-brand mb"><span className="logo"><Icon name="qr" size={18} /></span> QR Attendance</div>
          <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p className="muted small mb">{mode === "login" ? "Sign in to continue" : "It takes less than a minute"}</p>

          <form onSubmit={submit} className="stack">
            {mode === "register" && (
              <>
                <div className="seg">
                  {["student", "faculty"].map((r) => (
                    <button type="button" key={r} className={form.role === r ? "active" : ""}
                      onClick={() => setForm({ ...form, role: r })} style={{ textTransform: "capitalize" }}>{r}</button>
                  ))}
                </div>
                <input className="input" placeholder="Full name" value={form.name} onChange={set("name")} required />
                {form.role === "faculty" && (
                  <input className="input" placeholder="Faculty invite code" value={form.inviteCode} onChange={set("inviteCode")} required />
                )}
              </>
            )}
            <input className="input" type="email" placeholder="Email" value={form.email} onChange={set("email")} required />
            <input className="input" type="password" placeholder="Password" value={form.password} onChange={set("password")} required />
            <button className="btn btn-primary btn-block" disabled={loading}>
              {loading ? <span className="spinner" /> : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="center small mt muted">
            {mode === "login" ? "New here? " : "Already have an account? "}
            <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === "login" ? "register" : "login"); }}>
              {mode === "login" ? "Register" : "Sign in"}
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}