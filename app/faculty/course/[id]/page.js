"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Shell from "@/components/Shell";
import Icon from "@/components/Icons";
import TrendChart from "@/components/TrendChart";

const tone = (p) => (p >= 75 ? "good" : p >= 60 ? "warn" : "bad");

export default function Report() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [trend, setTrend] = useState(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [onlyRisk, setOnlyRisk] = useState(false);

  useEffect(() => {
    fetch(`/api/courses/${id}/report`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message));
    fetch(`/api/courses/${id}/trends`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setTrend)
      .catch(() => {});
  }, [id]);

  const stats = useMemo(() => {
    if (!data) return null;
    const s = data.students;
    const avg = s.length ? Math.round(s.reduce((a, x) => a + x.percent, 0) / s.length) : 0;
    const risk = s.filter((x) => x.percent < 75).length;
    return { avg, risk };
  }, [data]);

  const rows = useMemo(() => {
    if (!data) return [];
    return data.students.filter((s) =>
      (!onlyRisk || s.percent < 75) &&
      (s.name + s.email).toLowerCase().includes(q.toLowerCase()));
  }, [data, q, onlyRisk]);

  return (
    <Shell role="faculty">
      <Link href="/faculty" className="btn btn-sm mb"><Icon name="back" size={16} /> Back</Link>

      {error && <div className="banner"><Icon name="alert" /><span>{error}</span></div>}
      {!data && !error && <div className="skeleton" style={{ height: 300 }} />}

      {data && (
        <>
          <div className="row between mb">
            <div>
              <span className="badge">{data.course.code}</span>
              <h1 style={{ marginTop: 8 }}>{data.course.name}</h1>
            </div>
            <div className="row">
              <Link href={`/faculty/course/${id}/history`} className="btn">Session history</Link>
              <button className="btn" onClick={() => window.print()}>Print</button>
              <a className="btn btn-primary" href={`/api/courses/${id}/report?format=csv`}>
                <Icon name="download" size={18} /> CSV
              </a>
            </div>
          </div>

          <div className="grid c4 mb">
            {[
              ["users", "i1", data.students.length, "Students"],
              ["qr", "i2", data.totalSessions, "Sessions held"],
              ["chart", "i4", `${stats.avg}%`, "Class average"],
              ["alert", "i3", stats.risk, "Below 75%"],
            ].map(([ic, cls, n, label]) => (
              <div className="card stat" key={label}>
                <span className={`ico ${cls}`}><Icon name={ic} /></span>
                <div><b>{n}</b><span className="muted small">{label}</span></div>
              </div>
            ))}
          </div>

          {trend && (
            <div className="card mb">
              <div className="row between mb">
                <h3>Attendance by session</h3>
                <span className="muted small">Dashed line = 75%</span>
              </div>
              <TrendChart points={trend.points} />
            </div>
          )}

          <div className="card">
            <div className="row mb">
              <div className="search">
                <Icon name="search" size={18} />
                <input className="input" placeholder="Search students" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <div className="seg" style={{ minWidth: 180 }}>
                <button className={!onlyRisk ? "active" : ""} onClick={() => setOnlyRisk(false)}>All</button>
                <button className={onlyRisk ? "active" : ""} onClick={() => setOnlyRisk(true)}>At risk</button>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Student</th><th>Attended</th><th>Progress</th><th>Recent</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="row" style={{ flexWrap: "nowrap" }}>
                          <span className="avatar">{s.name[0].toUpperCase()}</span>
                          <div><b>{s.name}</b><div className="muted small">{s.email}</div></div>
                        </div>
                      </td>
                      <td>{s.attended}/{data.totalSessions}</td>
                      <td style={{ minWidth: 130 }}>
                        <div className="bar"><i style={{ width: `${s.percent}%`, background: `var(--${tone(s.percent)})` }} /></div>
                        <span className="small muted">{s.percent}%</span>
                      </td>
                      <td><div className="dots">{s.marks.slice(-20).map((m, i) => <span key={i} className={`dot ${m ? "on" : ""}`} />)}</div></td>
                      <td><span className={`badge ${tone(s.percent)}`}>{s.percent >= 75 ? "Good" : s.percent >= 60 ? "Warning" : "At risk"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length === 0 && (
              <p className="center muted" style={{ padding: 24 }}>
                {data.students.length === 0 ? "No students have joined yet. Share the join code." : "No students match."}
              </p>
            )}
          </div>
        </>
      )}
    </Shell>
  );
}