"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import Shell from "@/components/Shell";
import Ring from "@/components/Ring";
import Icon from "@/components/Icons";
import { useToast } from "@/components/Toast";

export default function LiveSession() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const [info, setInfo] = useState(null);
  const [ended, setEnded] = useState(false);
  const [left, setLeft] = useState(30);
  const [remain, setRemain] = useState("");
  const lastWin = useRef(0);

  async function load() {
    const res = await fetch(`/api/sessions/${id}/token`);
    if (!res.ok) return setEnded(true);
    setInfo(await res.json());
  }

  useEffect(() => {
    load();
    const poll = setInterval(load, 3000);
    return () => clearInterval(poll);
  }, [id]);

  useEffect(() => {
    const tick = setInterval(() => {
      const now = Date.now() / 1000;
      setLeft(30 - Math.floor(now % 30));
      const win = Math.floor(now / 30);
      if (lastWin.current && win !== lastWin.current) load();
      lastWin.current = win;
      if (info?.endsAt) {
        const s = Math.max(0, Math.floor((new Date(info.endsAt) - Date.now()) / 1000));
        setRemain(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`);
        if (s === 0) setEnded(true);
      }
    }, 250);
    return () => clearInterval(tick);
  }, [info?.endsAt]);

  async function endSession() {
    await fetch(`/api/sessions/${id}/end`, { method: "POST" });
    toast("Session ended", "success");
    router.push("/faculty");
  }

  function fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  }

  return (
    <Shell role="faculty">
      {ended ? (
        <div className="empty">
          <div className="ico i4"><Icon name="check" size={26} /></div>
          <h3 style={{ color: "var(--text)" }}>This session has ended</h3>
          <p className="small mb">Attendance is saved. View it in the course report.</p>
          <Link href="/faculty" className="btn btn-primary">Back to dashboard</Link>
        </div>
      ) : !info ? (
        <div className="skeleton" style={{ height: 420 }} />
      ) : (
        <>
          <div className="row between mb">
            <div>
              <div className="row"><span className="live-dot" /><b>LIVE</b><span className="muted">· closes in {remain}</span></div>
              <h1>{info.course}</h1>
            </div>
            <div className="row">
              <button className="btn" onClick={fullscreen}><Icon name="expand" size={18} /> Project</button>
              <button className="btn btn-danger" onClick={endSession}>End session</button>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
            <div className="card center stack" style={{ justifyItems: "center" }}>
              <div className="qr-tile"><QRCodeSVG value={info.token} size={280} level="M" /></div>
              <div className="row">
                <div className="ring" style={{ width: 54, height: 54 }}>
                  <svg width="54" height="54" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="27" cy="27" r="23" fill="none" stroke="var(--card-b)" strokeWidth="5" />
                    <circle cx="27" cy="27" r="23" fill="none" stroke="var(--primary2)" strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 23} strokeDashoffset={2 * Math.PI * 23 * (1 - left / 30)}
                      style={{ transition: "stroke-dashoffset .25s linear" }} />
                  </svg>
                  <span className="ring-label" style={{ fontSize: 15 }}>{left}</span>
                </div>
                <span className="muted small">Code refreshes automatically<br />Students must scan the latest one</span>
              </div>
            </div>

            <div className="card stack">
              <div className="row between">
                <div><div className="big-num grad">{info.count}</div><span className="muted">students present</span></div>
                <span className="badge good"><span className="live-dot" style={{ width: 8, height: 8 }} /> live</span>
              </div>
              <div className="feed">
                {info.attendees.length === 0 && <p className="muted small">Waiting for the first scan…</p>}
                {info.attendees.map((a, i) => (
                  <div className="feed-item" key={a.name + a.marked_at}>
                    <span className="avatar" style={{ width: 30, height: 30 }}>{a.name[0].toUpperCase()}</span>
                    <b style={{ flex: 1 }}>{a.name}</b>
                    <span className="muted small">{new Date(a.marked_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </Shell>
  );
}