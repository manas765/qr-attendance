export default function TrendChart({ points }) {
  const data = points.slice(-20);
  if (!data.length) return <p className="muted small">No sessions yet.</p>;

  const W = 600, H = 170, top = 14, bottom = 28, left = 30;
  const plotH = H - top - bottom;
  const slot = (W - left) / data.length;
  const bw = Math.min(28, slot * 0.6);
  const y = (p) => top + plotH * (1 - p / 100);
  const color = (p) => (p >= 75 ? "var(--good)" : p >= 60 ? "var(--warn)" : "var(--bad)");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Attendance per session">
      {[0, 50, 100].map((g) => (
        <g key={g}>
          <line x1={left} x2={W} y1={y(g)} y2={y(g)} stroke="var(--border)" />
          <text x={left - 6} y={y(g) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{g}</text>
        </g>
      ))}
      <line x1={left} x2={W} y1={y(75)} y2={y(75)} stroke="var(--warn)" strokeDasharray="4 4" />
      {data.map((d, i) => {
        const x = left + slot * i + (slot - bw) / 2;
        const dt = new Date(d.starts_at);
        const showLabel = data.length <= 12 || i % 2 === 0;
        return (
          <g key={d.id}>
            <rect x={x} y={y(d.percent)} width={bw} height={plotH * (d.percent / 100)} rx="3" fill={color(d.percent)} />
            {showLabel && (
              <text x={x + bw / 2} y={H - 10} textAnchor="middle" fontSize="10" fill="var(--muted)">
                {dt.getDate()}/{dt.getMonth() + 1}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}