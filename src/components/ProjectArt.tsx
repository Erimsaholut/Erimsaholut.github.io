import type { ArtKind } from "../data";

/* Original vector illustrations for each project — no external imagery. */

const AMBER = "#FFB547";
const SAGE = "#93D3A2";
const SKY = "#8FB0EC";
const LINE = "#343A30";
const INK = "#ECE8DF";

function Kiosk() {
  const slots = Array.from({ length: 12 }, (_, i) => i);
  const stocked = new Set([0, 1, 3, 4, 5, 7, 8, 10]);
  return (
    <>
      <rect x="118" y="18" width="104" height="150" rx="10" fill="#141712" stroke={LINE} strokeWidth="2" />
      <rect x="130" y="30" width="80" height="34" rx="5" fill="#0F110E" stroke={LINE} />
      {["EN", "TR", "IT"].map((l, i) => (
        <g key={l}>
          <rect x={137 + i * 23} y="40" width="19" height="14" rx="3" fill={i === 0 ? AMBER : "none"} stroke={i === 0 ? AMBER : LINE} />
          <text x={146.5 + i * 23} y="50.5" textAnchor="middle" fontSize="7.5" fontFamily="JetBrains Mono, monospace" fill={i === 0 ? "#0F110E" : INK}>
            {l}
          </text>
        </g>
      ))}
      {slots.map((i) => {
        const cx = 133 + (i % 4) * 19;
        const cy = 76 + Math.floor(i / 4) * 24;
        return (
          <rect
            key={i}
            x={cx}
            y={cy}
            width="13"
            height="18"
            rx="3"
            fill={stocked.has(i) ? (i % 3 === 0 ? SAGE : AMBER) : "none"}
            fillOpacity={stocked.has(i) ? 0.85 : 0}
            stroke={stocked.has(i) ? "none" : LINE}
            strokeDasharray="3 2"
            className="transition-transform duration-500 group-hover:-translate-y-0.5"
          />
        );
      })}
      <rect x="140" y="150" width="60" height="8" rx="4" fill={LINE} />
      {/* live sync badge */}
      <g className="transition-transform duration-500 group-hover:translate-x-1">
        <rect x="236" y="62" width="64" height="26" rx="13" fill="#141712" stroke={LINE} />
        <circle cx="250" cy="75" r="4" fill={SAGE} />
        <text x="260" y="78.5" fontSize="9" fontFamily="JetBrains Mono, monospace" fill={INK}>live</text>
      </g>
      <path d="M222 75 C 228 75, 230 75, 236 75" stroke={LINE} strokeWidth="2" strokeDasharray="3 3" />
      <g>
        <rect x="30" y="96" width="70" height="26" rx="13" fill="#141712" stroke={LINE} />
        <text x="65" y="112.5" textAnchor="middle" fontSize="9" fontFamily="JetBrains Mono, monospace" fill={INK}>stock</text>
      </g>
      <path d="M100 109 H 118" stroke={LINE} strokeWidth="2" strokeDasharray="3 3" />
    </>
  );
}

function Cafe() {
  const bars = [28, 42, 36, 56, 50, 70, 84];
  return (
    <>
      <path d="M40 150 H 286" stroke={LINE} strokeWidth="2" />
      {bars.map((h, i) => (
        <rect
          key={i}
          x={52 + i * 32}
          y={150 - h}
          width="20"
          height={h}
          rx="4"
          fill={i === bars.length - 1 ? AMBER : "#2B3127"}
          style={{ transformOrigin: `${62 + i * 32}px 150px` }}
          className="transition-transform duration-500 group-hover:scale-y-110"
        />
      ))}
      <polyline
        points={bars.map((h, i) => `${62 + i * 32},${150 - h - 14}`).join(" ")}
        fill="none"
        stroke={SAGE}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {bars.map((h, i) => (
        <circle key={i} cx={62 + i * 32} cy={150 - h - 14} r="3" fill="#0F110E" stroke={SAGE} strokeWidth="2" />
      ))}
      {["W", "M", "Y"].map((l, i) => (
        <g key={l}>
          <rect x={40 + i * 30} y="20" width="24" height="18" rx="5" fill={i === 1 ? AMBER : "none"} stroke={i === 1 ? AMBER : LINE} />
          <text x={52 + i * 30} y="32.5" textAnchor="middle" fontSize="9" fontFamily="JetBrains Mono, monospace" fill={i === 1 ? "#0F110E" : INK}>{l}</text>
        </g>
      ))}
      <text x="286" y="33" textAnchor="end" fontSize="10" fontFamily="JetBrains Mono, monospace" fill={SAGE}>profit ↑</text>
    </>
  );
}

function Chat() {
  return (
    <>
      <circle cx="52" cy="58" r="13" fill="#2B3127" />
      <rect x="74" y="40" width="130" height="34" rx="12" fill="#1B1F19" stroke={LINE} />
      <rect x="86" y="51" width="80" height="5" rx="2.5" fill={LINE} />
      <rect x="86" y="61" width="52" height="5" rx="2.5" fill={LINE} />

      <g className="transition-transform duration-500 group-hover:-translate-y-1">
        <rect x="128" y="88" width="140" height="34" rx="12" fill={AMBER} />
        <rect x="140" y="99" width="90" height="5" rx="2.5" fill="#0F110E" fillOpacity="0.45" />
        <rect x="140" y="109" width="60" height="5" rx="2.5" fill="#0F110E" fillOpacity="0.45" />
      </g>
      <circle cx="284" cy="106" r="13" fill={SKY} fillOpacity="0.8" />

      <circle cx="52" cy="152" r="13" fill="#2B3127" />
      <rect x="74" y="136" width="62" height="30" rx="12" fill="#1B1F19" stroke={LINE} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={92 + i * 13} cy="151" r="3.5" fill={INK} fillOpacity={0.35 + i * 0.2} />
      ))}
      <rect x="216" y="20" width="76" height="22" rx="11" fill="#141712" stroke={LINE} />
      <circle cx="230" cy="31" r="3.5" fill={SAGE} />
      <text x="240" y="34.5" fontSize="9" fontFamily="JetBrains Mono, monospace" fill={INK}>online</text>
    </>
  );
}

function Data() {
  // Deterministic pseudo-random scatter with a positive trend.
  let s = 7;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const pts = Array.from({ length: 34 }, () => {
    const x = rnd();
    const y = Math.min(0.95, Math.max(0.05, 0.15 + 0.65 * x + (rnd() - 0.5) * 0.32));
    return [50 + x * 230, 150 - y * 120] as const;
  });
  return (
    <>
      <path d="M44 18 V 152 H 290" fill="none" stroke={LINE} strokeWidth="2" />
      {[50, 90].map((y) => (
        <path key={y} d={`M44 ${y} H 290`} stroke={LINE} strokeDasharray="3 5" />
      ))}
      {pts.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="4"
          fill={i % 5 === 0 ? SKY : SAGE}
          fillOpacity="0.8"
          className="transition-opacity duration-500 group-hover:opacity-100"
        />
      ))}
      <path d="M50 138 L 282 52" stroke={AMBER} strokeWidth="2.5" strokeDasharray="6 5" />
      <rect x="200" y="22" width="86" height="22" rx="11" fill="#141712" stroke={LINE} />
      <text x="243" y="36.5" textAnchor="middle" fontSize="9" fontFamily="JetBrains Mono, monospace" fill={AMBER}>corr()</text>
    </>
  );
}

export default function ProjectArt({ kind }: { kind: ArtKind }) {
  return (
    <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden>
      <defs>
        <pattern id={`dots-${kind}`} width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#ECE8DF" fillOpacity="0.07" />
        </pattern>
      </defs>
      <rect width="320" height="180" fill={`url(#dots-${kind})`} />
      {kind === "kiosk" && <Kiosk />}
      {kind === "cafe" && <Cafe />}
      {kind === "chat" && <Chat />}
      {kind === "data" && <Data />}
    </svg>
  );
}
