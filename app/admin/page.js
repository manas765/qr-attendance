"use client";
import { useEffect, useMemo, useState } from "react";
import Shell from "@/components/Shell";
import Icon from "@/components/Icons";
import { useToast } from "@/components/Toast";

export default function Admin() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  async function load() {
    const res = await fetch("/api/admin/overview");
    if (res.ok) setData(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function act(id, action) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return toast(d.error || "Failed", "error");
    toast(action === "approve" ? "Faculty approved" : "Access revoked", "success");
    load();
  }

  async function remove(u) {
    if (!window.confirm(`Remove ${u.name}? Their attendance records will be deleted.`)) return;
    const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return toast(d.error || "Failed", "error");
    toast("User removed", "success");
    load();
  }

  const users = data?.users;
  const pending = (users || []).filter((u) => u.role === "faculty" && !u.approved);
  const shown = useMemo(
    () => (users || []).filter((u) =>
      (filter === "all" || u.role === filter) &&
      (u.name + u.email).toLowerCase().includes(q.toLowerCase())),
    [users, q, filter]
  );

  return (
    <Shell role="admin">
      <h1>Admin</h1>
      <p className="muted mb">Approve faculty and manage accounts.</p>

      {!data ? <div className="skeleton" style={{ height: 300 }} /> : (
        <>
          <div className="grid c4 mb">
            {[
              ["users", "i1", users.length, "Users"],
              ["alert", "i4", pending.length, "Awaiting approval"],
              ["book", "i2", data.courses.length, "Courses"],
              ["check", "i1", data.marks, "Attendance records"],
            ].map(([ic, cls, n, label]) => (
              <div className="card stat" key={label}>
                <span className={`ico ${cls}`}><Icon name={ic} /></span>
                <div><b>{n}</b><span className="muted small">{label}</span></div>
              </div>
            ))}
          </div>

          {pending.length > 0 && (
            <div className="card mb">
              <h3 className="mb">Faculty awaiting approval</h3>
              <div className="stack">
                {pending.map((u) => (
                  <div className="feed-item" key={u.id} style={{ flexWrap: "wrap" }}>
                    <span className="avatar">{u.name[0].toUpperCase()}</span>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <b>{u.name}</b><div className="muted small">{u.email}</div>
                    </div>
                    <button className="btn btn-sm btn-primary" onClick={() => act(u.id, "approve")}>Approve</button>
                    <button className="btn btn-sm btn-danger" onClick={() => remove(u)}>Reject</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card mb">
            <div className="row mb">
              <div className="search">
                <Icon name="search" size={18} />
                <input className="input" placeholder="Search users" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <div className="seg" style={{ minWidth: 240 }}>
                {["all", "student", "faculty"].map((f) => (
                  <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}
                    style={{ textTransform: "capitalize" }}>{f}</button>
                ))}
              </div>
            </div>
            <div className="stack">
              {shown.map((u) => (
                <div className="feed-item" key={u.id} style={{ flexWrap: "wrap" }}>
                  <span className="avatar">{u.name[0].toUpperCase()}</span>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <b>{u.name}</b><div className="muted small">{u.email}</div>
                  </div>
                  <span className="badge" style={{ textTransform: "capitalize" }}>{u.role}</span>
                  {u.role === "faculty" && (
                    <span className={`badge ${u.approved ? "good" : "warn"}`}>{u.approved ? "Active" : "Not approved"}</span>
                  )}
                  {u.role === "faculty" && u.approved && (
                    <button className="btn btn-sm" onClick={() => act(u.id, "revoke")}>Revoke</button>
                  )}
                  {u.role === "faculty" && !u.approved && (
                    <button className="btn btn-sm btn-primary" onClick={() => act(u.id, "approve")}>Approve</button>
                  )}
                  {u.role !== "admin" && (
                    <button className="btn btn-sm btn-danger" onClick={() => remove(u)}>Remove</button>
                  )}
                </div>
              ))}
              {shown.length === 0 && <p className="muted center small">No users match.</p>}
            </div>
          </div>

          <div className="card">
            <h3 className="mb">All courses</h3>
            <div className="stack">
              {data.courses.map((c) => (
                <div className="feed-item" key={c.id} style={{ flexWrap: "wrap" }}>
                  <span className="badge">{c.code}</span>
                  <b style={{ flex: 1, minWidth: 140 }}>{c.name}</b>
                  <span className="muted small">{c.faculty} · {c.students} students · {c.sessions} sessions</span>
                </div>
              ))}
              {data.courses.length === 0 && <p className="muted center small">No courses yet.</p>}
            </div>
          </div>
        </>
      )}
    </Shell>
  );
}