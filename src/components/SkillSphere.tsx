import { useEffect, useMemo, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { SKILLS } from "../data";

type Tone = "cloud" | "found" | "base";

/** Skill tags distributed on a rotating sphere; steer it by moving the pointer over it. */
export default function SkillSphere() {
  const box = useRef<HTMLDivElement>(null);
  const tags = useRef<(HTMLSpanElement | null)[]>([]);
  const reduce = useReducedMotion();

  const items = useMemo(() => {
    const seen = new Set<string>();
    const out: { label: string; tone: Tone }[] = [];
    SKILLS.forEach((g) =>
      g.items.forEach((label) => {
        if (seen.has(label)) return;
        seen.add(label);
        out.push({ label, tone: g.foundational ? "found" : g.group.startsWith("Cloud") ? "cloud" : "base" });
      })
    );
    return out;
  }, []);

  const points = useMemo(() => {
    const n = items.length;
    const golden = Math.PI * (3 - Math.sqrt(5));
    return items.map((_, i) => {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      return [Math.cos(i * golden) * r, y, Math.sin(i * golden) * r] as const;
    });
  }, [items]);

  useEffect(() => {
    const el = box.current!;
    let raf = 0;
    let visible = false;
    let ax = 0.35;
    let ay = 0;
    const idle = { x: 0.0012, y: 0.0032 };
    let vx = idle.x;
    let vy = idle.y;
    let tvx = vx;
    let tvy = vy;

    const render = () => {
      const R = el.clientWidth * 0.38;
      const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay);
      points.forEach(([x, y, z], i) => {
        const x1 = x * cy + z * sy;
        const z1 = -x * sy + z * cy;
        const y2 = y * cx - z1 * sx;
        const z2 = y * sx + z1 * cx;
        const depth = (z2 + 1) / 2;
        const node = tags.current[i];
        if (!node) return;
        node.style.transform = `translate3d(${(x1 * R).toFixed(1)}px, ${(y2 * R).toFixed(1)}px, 0) translate(-50%, -50%) scale(${(0.6 + 0.4 * depth).toFixed(3)})`;
        node.style.opacity = (0.18 + 0.82 * depth).toFixed(3);
        node.style.zIndex = String(Math.round(depth * 100));
        node.style.filter = depth < 0.35 ? `blur(${((0.35 - depth) * 4).toFixed(1)}px)` : "";
      });
    };

    const loop = () => {
      vx += (tvx - vx) * 0.05;
      vy += (tvy - vy) * 0.05;
      ax += vx;
      ay += vy;
      render();
      if (visible) raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tvy = ((e.clientX - r.left) / r.width - 0.5) * 0.035;
      tvx = -((e.clientY - r.top) / r.height - 0.5) * 0.035;
    };
    const onLeave = () => {
      tvx = idle.x;
      tvy = idle.y;
    };

    render();
    if (reduce) return;
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(loop);
    });
    io.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [points, reduce]);

  const toneClass: Record<Tone, string> = {
    cloud: "bg-amber text-bg shadow-[0_0_24px_rgba(255,181,71,0.45)]",
    found: "border border-dashed border-amber/70 bg-bg/80 text-amber",
    base: "border border-line bg-surface text-ink",
  };

  return (
    <div ref={box} className="relative mx-auto aspect-square w-full max-w-[460px] select-none" aria-hidden>
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,181,71,0.12),transparent_62%)]" />
      <svg className="absolute inset-[6%] h-[88%] w-[88%] animate-[spin_40s_linear_infinite] motion-reduce:animate-none" viewBox="0 0 100 100">
        <ellipse cx="50" cy="50" rx="48" ry="16" fill="none" stroke="#272C24" strokeWidth="0.4" />
        <ellipse cx="50" cy="50" rx="16" ry="48" fill="none" stroke="#272C24" strokeWidth="0.4" />
        <circle cx="50" cy="50" r="48" fill="none" stroke="#272C24" strokeWidth="0.4" strokeDasharray="1 2" />
      </svg>
      <div className="absolute left-1/2 top-1/2">
        {items.map((it, i) => (
          <span
            key={it.label}
            ref={(n) => {
              tags.current[i] = n;
            }}
            className={`absolute left-0 top-0 whitespace-nowrap rounded-md px-2.5 py-1 text-sm font-medium will-change-transform ${toneClass[it.tone]}`}
          >
            {it.label}
          </span>
        ))}
      </div>
    </div>
  );
}
