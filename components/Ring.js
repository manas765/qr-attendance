export default function Ring({ value = 0, size = 84, stroke = 8 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = value >= 75 ? "var(--good)" : value >= 60 ? "var(--warn)" : "var(--bad)";
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--card-b)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(value, 100) / 100)}
          style={{ transition: "stroke-dashoffset .9s ease" }} />
      </svg>
      <span className="ring-label" style={{ fontSize: size / 4.4 }}>{value}%</span>
    </div>
  );
}