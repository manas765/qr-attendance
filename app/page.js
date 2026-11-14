"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student", inviteCode: "" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({ error: "Server error" }));
    if (!res.ok) return setError(data.error);
    router.push(data.role === "faculty" ? "/faculty" : "/student");
  }

  return (
    <main style={{ maxWidth: 380, margin: "60px auto", padding: 16, fontFamily: "sans-serif" }}>
      <h1>QR Attendance</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        {mode === "register" && (
          <>
            <input placeholder="Full name" value={form.name} onChange={set("name")} required />
            <select value={form.role} onChange={set("role")}>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
            {form.role === "faculty" && (
              <input placeholder="Faculty invite code" value={form.inviteCode} onChange={set("inviteCode")} required />
            )}
          </>
        )}
        <input type="email" placeholder="Email" value={form.email} onChange={set("email")} required />
        <input type="password" placeholder="Password" value={form.password} onChange={set("password")} required />
        <button type="submit">{mode === "login" ? "Login" : "Create account"}</button>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
      </form>
      <p>
        <button onClick={() => setMode(mode === "login" ? "register" : "login")}
          style={{ background: "none", border: "none", color: "blue", cursor: "pointer" }}>
          {mode === "login" ? "New here? Register" : "Have an account? Login"}
        </button>
      </p>
    </main>
  );
}