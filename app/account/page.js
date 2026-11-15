"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { useToast } from "@/components/Toast";

export default function Account() {
  const toast = useToast();
  const [me, setMe] = useState(null);
  const [f, setF] = useState({ current: "", next: "", again: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => { fetch("/api/me").then((r) => r.json()).then(setMe).catch(() => {}); }, []);

  async function submit(e) {
    e.preventDefault();
    if (f.next !== f.again) return toast("New passwords don't match", "error");
    setBusy(true);
    const res = await fetch("/api/account/password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current: f.current, next: f.next }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast(d.error || "Failed", "error");
    toast("Password changed", "success");
    setF({ current: "", next: "", again: "" });
  }

  return (
    <Shell role="any">
      <h1>Account</h1>
      <p className="muted mb">{me ? `${me.name} · ${me.role}` : ""}</p>
      <form onSubmit={submit} className="card stack" style={{ maxWidth: 420 }}>
        <h3>Change password</h3>
        <input className="input" type="password" placeholder="Current password" value={f.current}
          onChange={(e) => setF({ ...f, current: e.target.value })} required />
        <input className="input" type="password" placeholder="New password (min 6 characters)" value={f.next}
          onChange={(e) => setF({ ...f, next: e.target.value })} required />
        <input className="input" type="password" placeholder="Repeat new password" value={f.again}
          onChange={(e) => setF({ ...f, again: e.target.value })} required />
        <button className="btn btn-primary" disabled={busy}>{busy ? <span className="spinner" /> : "Update password"}</button>
      </form>
    </Shell>
  );
}