import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { EASE } from "./Section";

/** Thin amber bar at the top that tracks page scroll. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });
  return <motion.div style={{ scaleX }} className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-amber" aria-hidden />;
}

/** Soft amber light that trails the mouse cursor. */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    const el = ref.current!;
    const target = { x: innerWidth / 2, y: innerHeight / 3 };
    const pos = { ...target };
    let raf = 0;
    const move = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      el.style.opacity = "1";
    };
    const loop = () => {
      pos.x += (target.x - pos.x) * 0.12;
      pos.y += (target.y - pos.y) * 0.12;
      el.style.transform = `translate3d(${pos.x - 300}px, ${pos.y - 300}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);
  return (
    <div
      ref={ref}
      className="pointer-events-none fixed left-0 top-0 z-[1] h-[600px] w-[600px] rounded-full opacity-0 transition-opacity duration-700"
      style={{ background: "radial-gradient(circle, rgba(255,181,71,0.07), transparent 60%)" }}
      aria-hidden
    />
  );
}

/** 3D tilt toward the pointer with a moving highlight. Mouse only. */
export function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== "mouse") return;
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.transform = `perspective(1100px) rotateX(${((0.5 - py) * 9).toFixed(2)}deg) rotateY(${((px - 0.5) * 11).toFixed(2)}deg) scale(1.015)`;
    el.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`group/tilt relative h-full transition-transform duration-300 ease-out will-change-transform ${className}`}
    >
      {children}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100"
        style={{ background: "radial-gradient(520px circle at var(--gx, 50%) var(--gy, 50%), rgba(255,181,71,0.13), transparent 42%)" }}
        aria-hidden
      />
    </div>
  );
}

/** Pulls its child slightly toward the pointer. */
export function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 16 });
  const sy = useSpring(y, { stiffness: 220, damping: 16 });
  return (
    <motion.span
      ref={ref}
      style={{ x: sx, y: sy }}
      className="inline-block"
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        const r = ref.current!.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * 0.3);
        y.set((e.clientY - (r.top + r.height / 2)) * 0.4);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

/** Counts numeric values up when scrolled into view; non-numeric values render as-is. */
export function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const numeric = /^\d+(\.\d+)?$/.test(value);
  const decimals = value.split(".")[1]?.length ?? 0;
  const [shown, setShown] = useState(numeric && !reduce ? (0).toFixed(decimals) : value);

  useEffect(() => {
    if (!numeric || reduce || !inView) return;
    const c = animate(0, parseFloat(value), {
      duration: 1.6,
      ease: EASE,
      onUpdate: (v) => setShown(v.toFixed(decimals)),
    });
    return () => c.stop();
  }, [inView, numeric, reduce, value, decimals]);

  return <span ref={ref}>{shown}</span>;
}

/** Types and deletes words in a loop. */
export function Typewriter({ words }: { words: string[] }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [text, setText] = useState(reduce ? words[0] : "");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const word = words[i];
    let t: ReturnType<typeof setTimeout>;
    if (!deleting && text === word) t = setTimeout(() => setDeleting(true), 1700);
    else if (deleting && text === "") {
      t = setTimeout(() => {
        setDeleting(false);
        setI((n) => (n + 1) % words.length);
      }, 250);
    } else t = setTimeout(() => setText(deleting ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1)), deleting ? 32 : 68);
    return () => clearTimeout(t);
  }, [text, deleting, i, words, reduce]);

  return (
    <span className="text-ink">
      {text}
      <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.18em] bg-amber animate-blink" />
    </span>
  );
}
