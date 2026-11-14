"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Shell from "@/components/Shell";
import Modal from "@/components/Modal";
import Icon from "@/components/Icons";
import { useToast } from "@/components/Toast";

export default function Faculty() {
  const router = useRouter();
  const toast = useToast();
  const [courses, setCourses] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [startFor, setStartFor] = useState(null);
  const [minutes, setMinutes] = useState(60);
  const [geo, setGeo] = useState(false);
  const [radius, setRadius] = useState(150);
  const [form, setForm] = useState({ code: "", name: "" });
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/courses");
    if (res.ok) setCourses(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function createCourse(e) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/courses", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast(data.error || "Failed", "error");
    toast("Course created", "success");
    setForm({ code: "", name: "" });
    setShowCreate(false);
    load();
  }

  async function startSession() {
    setBusy(true);
    let loc = {};
    if (geo) {
      const pos = await new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (p) => resolve(p.coords), () => resolve(null),
          { enableHighAccuracy: true, timeout: 10000 });
      });
      if (!pos) {
        setBusy(false);
        return toast("Could not get your location. Allow location access or turn the check off.", "error");
      }
      loc = { lat: pos.latitude, lng: pos.longitude, radius };
    }
    const res = await fetch("/api/sessions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: startFor.id, minutes, ...loc }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast(data.error || "Failed", "error");
    router.push(`/faculty/session/${data.id}`);
  }

  function copy(code) {
    navigator.clipboard?.writeText(code);
    toast(`Join code ${code} copied`, "success");
  }

  const totalStudents = (courses || []).reduce((a, c) => a + c.students, 0);
  const totalSessions = (courses || []).reduce((a, c) => a + c.sessions, 0);

  return (
    <Shell role="faculty">
      <div className="row between mb">
        <div>
          <h1>Your classes</h1>
          <p className="muted">Create a course, share the join code, then start a session.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Icon name="plus" size={18} /> New course
        </button>
      </div>

      <div className="grid c4 mb">
        {[
          ["book", "i1", courses?.length ?? "–", "Courses"],
          ["users", "i2", courses ? totalStudents : "–", "Enrolled students"],
          ["qr", "i4", courses ? totalSessions : "–", "Sessions held"],
        ].map(([ic, cls, n, label]) => (
          <div className="card stat" key={label}>
            <span className={`ico ${cls}`}><Icon name={ic} /></span>
            <div><b>{n}</b><span className="muted small">{label}</span></div>
          </div>
        ))}
      </div>

      {courses === null && <div className="grid c2">{[1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 170 }} />)}</div>}

      {courses?.length === 0 && (
        <div className="empty">
          <div className="ico i1"><Icon name="book" size={26} /></div>
          <h3 style={{ color: "var(--text)" }}>No courses yet</h3>
          <p className="small mb">Create your first course to get a join code for students.</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Icon name="plus" size={18} /> Create course</button>
        </div>
      )}

      <div className="grid c2">
        {courses?.map((c) => (
          <div key={c.id} className="card hover stack">
            <div className="row between">
              <span className="badge">{c.code}</span>
              <span className="muted small">{c.students} students · {c.sessions} sessions</span>
            </div>
            <h2>{c.name}</h2>
            <div className="row between">
              <span className="muted small">Join code</span>
              <span className="code-pill">
                {c.join_code}
                <button className="btn btn-sm btn-icon" onClick={() => copy(c.join_code)} aria-label="Copy"><Icon name="copy" size={14} /></button>
              </span>
            </div>
            <div className="row">
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setStartFor(c)}>
                <Icon name="qr" size={18} /> Start session
              </button>
              <Link href={`/faculty/course/${c.id}`} className="btn"><Icon name="chart" size={18} /> Report</Link>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <Modal title="New course" onClose={() => setShowCreate(false)}>
          <form onSubmit={createCourse} className="stack">
            <label className="lbl">Course code
              <input className="input" placeholder="MCA301" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            </label>
            <label className="lbl">Course name
              <input className="input" placeholder="Cloud Computing" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <button className="btn btn-primary" disabled={busy}>{busy ? <span className="spinner" /> : "Create course"}</button>
          </form>
        </Modal>
      )}

      {startFor && (
        <Modal title="Start session" onClose={() => setStartFor(null)}>
          <p className="muted small mb">{startFor.code} - {startFor.name}</p>
          <p className="small mb" style={{ fontWeight: 600 }}>How long should attendance stay open?</p>
          <div className="seg mb">
            {[15, 30, 60, 90, 120].map((m) => (
              <button key={m} className={minutes === m ? "active" : ""} onClick={() => setMinutes(m)}>{m}m</button>
            ))}
          </div>

          <label className="row mb" style={{ cursor: "pointer", flexWrap: "nowrap" }}>
            <input type="checkbox" checked={geo} onChange={(e) => setGeo(e.target.checked)}
              style={{ width: 20, height: 20, flex: "none" }} />
            <span>
              <b>Require students to be in the classroom</b>
              <div className="muted small">Uses your current location as the centre</div>
            </span>
          </label>
          {geo && (
            <div className="seg mb">
              {[75, 150, 300].map((r) => (
                <button key={r} className={radius === r ? "active" : ""} onClick={() => setRadius(r)}>{r} m</button>
              ))}
            </div>
          )}

          <button className="btn btn-primary btn-block" onClick={startSession} disabled={busy}>
            {busy ? <span className="spinner" /> : "Go live"}
          </button>
        </Modal>
      )}
    </Shell>
  );
}