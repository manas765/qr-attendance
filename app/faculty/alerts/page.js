"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import Icon from "@/components/Icons";
import { useToast } from "@/components/Toast";

export default function Alerts() {
  const toast = useToast();
  const [rows, setRows] = useState(null);

  useEffect(() => {
    fetch("/api/alerts").then((r) => r.json())
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch(() => setRows([]));
  }, []);

  const msg = (r) =>
    `Hi ${r.name}, your attendance in ${r.code} ${r.course_name} is ${r.percent}% (${r.attended}/${r.total} classes). Please attend regularly to stay above 75%.`;

  function copy(r) {
    navigator.clipboard?.writeText(msg(r));
    toast("Reminder copied", "success");
  }

  return (
    <Shell role="faculty">
      <h1>Low attendance</h1>
      <p className="muted mb">Students below 75% across all your courses, lowest first.</p>

      {rows === null && <div className="skeleton" style={{ height: 200 }} />}

      {rows?.length === 0 && (
        <div className="empty">
          <div className="ico i2"><Icon name="check" size={26} /></div>
          <h3 style={{ color: "var(--text)" }}>Nobody is below 75%</h3>
          <p className="small">Students will appear here as soon as their attendance drops.</p>
        </div>
      )}

      <div className="stack">
        {rows?.map((r) => (
          <div className="card row between" key={`${r.course_id}-${r.id}`}>
            <div className="row" style={{ flexWrap: "nowrap" }}>
              <span className="avatar">{r.name[0].toUpperCase()}</span>
              <div>
                <b>{r.name}</b>
                <div className="muted small">{r.code} · {r.attended}/{r.total} classes</div>
              </div>
            </div>
            <div className="row">
              <span className={`badge ${r.percent < 60 ? "bad" : "warn"}`}>{r.percent}%</span>
              <button className="btn btn-sm" onClick={() => copy(r)}><Icon name="copy" size={14} /> Copy reminder</button>
              <a className="btn btn-sm btn-primary"
                href={`mailto:${r.email}?subject=${encodeURIComponent("Low attendance in " + r.code)}&body=${encodeURIComponent(msg(r))}`}>
                Email
              </a>
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}