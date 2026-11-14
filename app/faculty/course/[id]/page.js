"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function Report() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/courses/${id}/report`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <main style={{ padding: 24 }}><p style={{ color: "crimson" }}>{error}</p><Link href="/faculty">Back</Link></main>;
  if (!data) return <main style={{ padding: 24 }}>Loading...</main>;

  return (
    <main style={{ maxWidth: 700, margin: "40px auto", padding: 16, fontFamily: "sans-serif" }}>
      <Link href="/faculty">← Back</Link>
      <h1>{data.course.code} - {data.course.name}</h1>
      <p>{data.totalSessions} sessions held · {data.students.length} students</p>
      <a href={`/api/courses/${id}/report?format=csv`}>⬇ Download CSV</a>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #999" }}>
            <th>Name</th><th>Email</th><th>Attended</th><th>%</th>
          </tr>
        </thead>
        <tbody>
          {data.students.map((s) => (
            <tr key={s.id} style={{ borderBottom: "1px solid #ddd" }}>
              <td>{s.name}</td>
              <td>{s.email}</td>
              <td>{s.attended}/{data.totalSessions}</td>
              <td style={{ color: s.percent < 75 ? "crimson" : "green", fontWeight: "bold" }}>{s.percent}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.students.length === 0 && <p>No students have joined yet. Share the join code.</p>}
    </main>
  );
}