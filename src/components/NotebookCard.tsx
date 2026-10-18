import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

/* A notebook cell whose output is a hand-drawn line chart (2022 → 2026). */

const SERIES = [
  { label: "cloud", color: "#FFB547", seed: 1.3, base: 0.14, gain: 0.7 },
  { label: "backend", color: "#93D3A2", seed: 2.9, base: 0.1, gain: 0.54 },
  { label: "data", color: "#8FB0EC", seed: 4.7, base: 0.06, gain: 0.38 },
];

const YEARS = ["2022", "2023", "2024", "2025", "2026"];

function value(s: (typeof SERIES)[number], t: number) {
  const trend = s.base + s.gain * (1 - Math.exp(-2.2 * t)) * (0.75 + 0.25 * t);
  const wobble = 0.03 * Math.sin(t * 9 + s.seed) + 0.016 * Math.sin(t * 23 + s.seed * 2.3);
  return Math.min(0.96, trend + wobble * (0.5 + t));
}

function PlotCanvas({ startDelay }: { startDelay: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    const start = performance.now() + startDelay;
    const DURATION = 2400;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      const p = reduce ? 1 : Math.max(0, Math.min(1, (now - start) / DURATION));
      const L = 30;
      const R = 12;
      const T = 26;
      const B = 24;
      const pw = w - L - R;
      const ph = h - T - B;
      const x = (t: number) => L + t * pw;
      const y = (v: number) => T + (1 - v) * ph;

      ctx.clearRect(0, 0, w, h);
      ctx.font = '10px "JetBrains Mono", monospace';

      // grid + axis labels
      ctx.strokeStyle = "rgba(236,232,223,0.07)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      for (let i = 0; i <= 4; i++) {
        const yy = Math.round(T + (i / 4) * ph) + 0.5;
        ctx.beginPath();
        ctx.moveTo(L, yy);
        ctx.lineTo(w - R, yy);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.fillStyle = "#6F7268";
      ctx.textAlign = "center";
      YEARS.forEach((yr, i) => ctx.fillText(yr, x(i / (YEARS.length - 1)), h - 7));
      ctx.textAlign = "right";
      ["0", ".5", "1"].forEach((lbl, i) => ctx.fillText(lbl, L - 8, y(i / 2) + 3));

      // legend
      ctx.textAlign = "left";
      let lx = L;
      SERIES.forEach((s) => {
        ctx.fillStyle = s.color;
        ctx.fillRect(lx, 9, 8, 8);
        ctx.fillStyle = "#A2A499";
        ctx.fillText(s.label, lx + 13, 16.5);
        lx += ctx.measureText(s.label).width + 30;
      });

      // series
      SERIES.forEach((s) => {
        const steps = Math.max(2, Math.floor(120 * p));
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const t = (i / 120) * 1;
          const px = x(Math.min(t, p));
          const py = y(value(s, Math.min(t, p)));
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";
        ctx.stroke();

        // area under the leading series
        if (s === SERIES[0] && p > 0) {
          ctx.lineTo(x(p), y(0));
          ctx.lineTo(x(0), y(0));
          ctx.closePath();
          const g = ctx.createLinearGradient(0, T, 0, T + ph);
          g.addColorStop(0, "rgba(255,181,71,0.16)");
          g.addColorStop(1, "rgba(255,181,71,0)");
          ctx.fillStyle = g;
          ctx.fill();
        }

        // live head
        const hx = x(p);
        const hy = y(value(s, p));
        if (p > 0) {
          if (p >= 1 && !reduce) {
            const pulse = (Math.sin(now / 420 + s.seed) + 1) / 2;
            ctx.beginPath();
            ctx.arc(hx, hy, 3 + pulse * 4, 0, Math.PI * 2);
            ctx.fillStyle = s.color + "33";
            ctx.fill();
          }
          ctx.beginPath();
          ctx.arc(hx, hy, 3, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.fill();
        }
      });

      if (visible && !(reduce && p >= 1)) raf = requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(draw);
    });
    io.observe(canvas);
    resize();
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [reduce, startDelay]);

  return <canvas ref={ref} className="block h-48 w-full sm:h-56" role="img" aria-label="Line chart of growth in cloud, backend and data skills from 2022 to 2026" />;
}

type Tok = [string, string?];
const CODE: Tok[][] = [
  [["from ", "text-sage"], ["erimsah "], ["import ", "text-sage"], ["profile"]],
  [[""]],
  [["me "], ["= ", "text-faint"], ["profile", "text-sky"], ["("]],
  [["    city", "text-ink/80"], ["="], ['"Torino"', "text-amber"], [","]],
  [["    focus", "text-ink/80"], ["=["], ['"cloud"', "text-amber"], [", "], ['"aws"', "text-amber"], [", "], ['"backend"', "text-amber"], ["],"]],
  [["    open_to_internships", "text-ink/80"], ["="], ["True", "text-sky"], [","]],
  [[")"]],
  [["me"], ["."], ["plot", "text-sky"], ["()"]],
];

export default function NotebookCard() {
  const reduce = useReducedMotion();
  const lineDelay = 0.12;
  const plotDelay = reduce ? 0 : 600 + CODE.length * lineDelay * 1000;

  return (
    <div className="rounded-2xl border border-line bg-surface/90 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] backdrop-blur">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="font-mono text-xs text-muted">profile.ipynb</span>
        <span className="flex items-center gap-2 font-mono text-[11px] text-faint">
          <span className="h-1.5 w-1.5 rounded-full bg-sage" /> Python 3 · idle
        </span>
      </div>

      <div className="grid grid-cols-[auto,1fr] gap-x-3 px-4 pt-4">
        <span className="font-mono text-[11px] text-faint pt-0.5">In [1]:</span>
        <pre className="overflow-x-auto rounded-lg border border-line bg-bg/60 px-3 py-2.5 font-mono text-[12.5px] leading-6">
          {CODE.map((line, i) => (
            <motion.div
              key={i}
              initial={reduce ? false : { opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * lineDelay, duration: 0.3 }}
            >
              {line.map(([t, c], j) => (
                <span key={j} className={c}>
                  {t}
                </span>
              ))}
              {i === CODE.length - 1 && <span className="ml-0.5 inline-block h-4 w-[7px] translate-y-[3px] bg-amber/80 animate-blink" />}
            </motion.div>
          ))}
        </pre>
      </div>

      <div className="grid grid-cols-[auto,1fr] gap-x-3 px-4 pb-4 pt-3">
        <span className="font-mono text-[11px] text-faint pt-1">Out[1]:</span>
        <PlotCanvas startDelay={plotDelay} />
      </div>
    </div>
  );
}
