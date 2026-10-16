export type Segment = { label: string; emoji: string; win: boolean };

const FILLS = ["var(--seg-1)", "var(--seg-2)", "var(--seg-3)", "var(--seg-4)"];

export function Wheel({ segments, rotation, spinning }: { segments: Segment[]; rotation: number; spinning: boolean }) {
  const n = segments.length;
  const a = 360 / n;
  const r = 150;
  const pt = (deg: number, rad = r) => {
    const t = ((deg - 90) * Math.PI) / 180;
    return [160 + rad * Math.cos(t), 160 + rad * Math.sin(t)];
  };
  return (
    <div className="relative mx-auto aspect-square w-full max-w-80">
      <div className="absolute left-1/2 top-[-6px] z-10 size-0 -translate-x-1/2 border-x-[14px] border-t-[26px] border-x-transparent border-t-ink" />
      <svg
        viewBox="0 0 320 320"
        className="size-full drop-shadow-xl"
        style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? "transform 4.5s cubic-bezier(.17,.67,.12,1)" : "none" }}
      >
        <circle cx="160" cy="160" r="158" fill="var(--gold)" />
        {segments.map((s, i) => {
          const [x1, y1] = pt(i * a);
          const [x2, y2] = pt((i + 1) * a);
          const [tx = 0, ty = 0] = pt(i * a + a / 2, 100);
          return (
            <g key={i}>
              <path d={`M160 160 L${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2} Z`} fill={s.win ? FILLS[i % 4] : "var(--muted)"} stroke="var(--gold)" strokeWidth="3" />
              <g transform={`rotate(${i * a + a / 2} ${tx} ${ty})`}>
                <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize="26">{s.emoji}</text>
                <text x={tx} y={ty + 24} textAnchor="middle" fontSize="9" fontWeight="800" fill={s.win ? "var(--ink-foreground)" : "var(--muted-foreground)"}>
                  {s.label.length > 12 ? s.label.slice(0, 11) + "…" : s.label}
                </text>
              </g>
            </g>
          );
        })}
        <circle cx="160" cy="160" r="26" fill="var(--royal)" stroke="var(--gold)" strokeWidth="6" />
        <text x="160" y="161" textAnchor="middle" dominantBaseline="middle" fontSize="20">⭐</text>
      </svg>
    </div>
  );
}
