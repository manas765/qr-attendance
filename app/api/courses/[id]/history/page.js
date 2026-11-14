"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Shell from "@/components/Shell";
import Icon from "@/components/Icons";
import { useToast } from "@/components/Toast";

export default function History() {
  const { id } = useParams();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(null);
  const [roster, setRoster] = useState([]);

  useEffect(() => {
    fetch(`/api/courses/${id}/sessions`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  async function loadRoster(sid) {
    const res = await fetch(`/api/sessions/${sid}/roster`);
    if (res.ok) setRoster(await res.json());
  }

  async function toggleOpen(sid) {
    if (open === sid) return setOpen(null);
    setOpen(sid);
    setRoster([]);
    loadRoster(sid);
  }

  async function mark(sid, studentId, present) {
    const res = await fetch(`/api/sessions/${sid}/roster`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, present }),
    });
    if (!res.ok) return toast("Could not update", "error");
    toast(present ? "Marked present" : "Marked absent", "success");
    loadRoster(sid);
    fetch(`/api/courses/${id}/sessions`).then((r) => r.json()).then(setData);
  }

  return (
    <Shell role="faculty">
      <Link href={`/faculty/course/${id}`} className="btn btn-sm mb"><Icon name="back" size={16} /> Report</Link>
      {error && <div className="banner"><Icon name="alert" /><span>{error}</span></div>}
      {!data && !error && <div className="skeleton" style={{ height: 240 }} />}

      {data && (
        <>
          <span className="badge">{data.course.code}</span>
          <h1 className="mb" style={{ marginTop: 8 }}>Session history</h1>

          {data.sessions.length === 0 && (
            <div className="empty"><p className="small">No sessions yet. Start one from the dashboard.</p></div>
          )}

          <div className="stack">
            {data.sessions.map((s) => (
              <div className="card" key={s.id}>
                <div className="row between" style={{ cursor: "pointer" }} onClick={() => toggleOpen(s.id)}>
                  <div>
                    <b>{new Date(s.starts_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</b>
                    <div className="row" style={{ gap: 6, marginTop: 4 }}>
                      {s.geo && <span className="badge good">Location check</span>}
                      {s.flagged > 0 && <span className="badge bad">{s.flagged} flagged</span>}
                    </div>
                  </div>
                  <span className="muted">{s.present}/{data.total} present</span>
                </div>

                {open === s.id && (
                  <div className="stack mt">
                    {roster.map((r) => (
                      <div className="feed-item" key={r.id}>
                        <span className="avatar" style={{ width: 30, height: 30 }}>{r.name[0].toUpperCase()}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <b>{r.name}</b>
                          <div className="row" style={{ gap: 6 }}>
                            {r.present && r.method === "manual" && <span className="badge warn">Manual</span>}
                            {r.flagged && <span className="badge bad">Shared device</span>}
                            {r.distance_m != null && <span className="muted small">{r.distance_m} m away</span>}
                          </div>
                        </div>
                        <button className={`btn btn-sm ${r.present ? "" : "btn-primary"}`}
                          onClick={() => mark(s.id, r.id, !r.present)}>
                          {r.present ? "Mark absent" : "Mark present"}
                        </button>
                      </div>
                    ))}
                    {roster.length === 0 && <p className="muted small">Loading…</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}