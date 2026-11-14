"use client";
import { useEffect, useRef, useState } from "react";
import Shell from "@/components/Shell";
import Modal from "@/components/Modal";
import Ring from "@/components/Ring";
import Scanner from "@/components/Scanner";
import Icon from "@/components/Icons";
import { useToast } from "@/components/Toast";

function tip(a, t) {
  if (!t) return "No classes held yet";
  if (a / t >= 0.75) {
    const m = Math.floor(a / 0.75 - t + 1e-9);
    return m > 0
      ? `You can miss ${m} more class${m > 1 ? "es" : ""} and stay above 75%`
      : "Right on the 75% line. Don't skip the next class!";
  }
  const n = Math.ceil((0.75 * t - a) / 0.25);
  return `Attend the next ${n} class${n > 1 ? "es" : ""} in a row to reach 75%`;
}

export default function Student() {
  const toast = useToast();
  const [courses, setCourses] = useState(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [busyJoin, setBusyJoin] = useState(false);
  const busy = useRef(false);

  async function load() {
    const res = await fetch("/api/courses");
    if (res.ok) setCourses(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function handleScan(text) {
    if (busy.current) return;
    busy.current = true;
    try {
      const res = await fetch("/api/attend", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: text }),
      });
      const data = await res.json().catch(() => ({ error: "Server error" }));
      if (res.ok) { toast(data.message, "success"); setScanOpen(false); load(); }
      else toast(data.error || "Failed", "error");
    } finally {
      setTimeout(() => (busy.current = false), 2500);
    }
  }

  async function join(e) {
    e.preventDefault();
    setBusyJoin(true);
    const res = await fetch("/api/courses/join", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ joinCode }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyJoin(false);
    if (!res.ok) return toast(data.error || "Failed", "error");
    toast(data.message, "success");
    setJoinCode("");
    load();
  }

  const list = courses || [];
  const totalAtt = list.reduce((a, c) => a + c.attended, 0);
  const totalAll = list.reduce((a, c) => a + c.total, 0);
  const overall = totalAll ? Math.round((totalAtt / totalAll) * 100) : 0;
  const atRisk = list.filter((c) => c.total && c.attended / c.total < 0.75);

  return (
    <Shell role="student">
      <h1>My attendance</h1>
      <p className="muted mb">Scan the class QR to mark yourself present.</p>

      {atRisk.length > 0 && (
        <div className="banner mb">
          <Icon name="alert" />
          <div>
            <b>Low attendance warning</b>
            <div className="small muted">
              You're below 75% in {atRisk.map((c) => c.code).join(", ")}. Check the cards below to see how many classes you need.
            </div>
          </div>
        </div>
      )}

      <div className="grid c4 mb">
        <div className="card stat"><span className="ico i1"><Icon name="chart" /></span>
          <div><b>{courses ? `${overall}%` : "–"}</b><span className="muted small">Overall attendance</span></div></div>
        <div className="card stat"><span className="ico i2"><Icon name="book" /></span>
          <div><b>{courses ? list.length : "–"}</b><span className="muted small">Courses joined</span></div></div>
        <div className="card stat"><span className="ico i4"><Icon name="check" /></span>
          <div><b>{courses ? totalAtt : "–"}</b><span className="muted small">Classes attended</span></div></div>
      </div>

      <form onSubmit={join} className="card row mb" style={{ flexWrap: "nowrap" }}>
        <input className="input" placeholder="Enter a course join code" value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)} required style={{ textTransform: "uppercase" }} />
        <button className="btn btn-primary" disabled={busyJoin}>{busyJoin ? <span className="spinner" /> : "Join"}</button>
      </form>

      {courses === null && <div className="grid c2">{[1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 140 }} />)}</div>}

      {courses?.length === 0 && (
        <div className="empty">
          <div className="ico i2"><Icon name="book" size={26} /></div>
          <h3 style={{ color: "var(--text)" }}>No courses yet</h3>
          <p className="small">Ask your faculty for a join code and enter it above.</p>
        </div>
      )}

      <div className="grid c2">
        {list.map((c) => {
          const pct = c.total ? Math.round((c.attended / c.total) * 100) : 0;
          return (
            <div key={c.id} className="card hover row" style={{ flexWrap: "nowrap", gap: 16 }}>
              <Ring value={pct} size={92} />
              <div className="stack" style={{ gap: 6 }}>
                <span className="badge" style={{ width: "fit-content" }}>{c.code}</span>
                <b style={{ fontSize: "1.05rem" }}>{c.name}</b>
                <span className="muted small">{c.attended}/{c.total} classes attended</span>
                <span className="small" style={{ color: pct >= 75 ? "var(--good)" : "var(--warn)" }}>{tip(c.attended, c.total)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <button className="btn btn-primary fab" onClick={() => setScanOpen(true)}>
        <Icon name="qr" size={20} /> Scan QR
      </button>

      {scanOpen && (
        <Modal title="Scan class QR" onClose={() => setScanOpen(false)}>
          <Scanner onScan={handleScan} onError={(m) => toast(m, "error")} />
          <p className="muted small center mt">Point your camera at the code on the screen</p>
        </Modal>
      )}
    </Shell>
  );
}