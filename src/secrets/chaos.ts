import { useEffect } from "react";
import { unlock } from "./store";

/*
 * Chaos engineer: the visible part of the page "fails" — blocks crack loose and fall —
 * then heals itself. Triggered by the terminal's `chaos` command or by shaking a phone.
 * Pure DOM + Web Animations, nothing is re-rendered and nothing is left behind.
 */

const MAX_PIECES = 36;
let running = false;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The smallest reasonably sized blocks currently on screen (text lines, chips, cards, icons…). */
function pickPieces(): HTMLElement[] {
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const all = Array.from(document.querySelectorAll<HTMLElement>("main *")).filter((el) => {
    if (el.closest("[data-chaos-skip]")) return false;
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh || r.width < 24 || r.height < 14) return false;
    if (r.width > vw * 0.9 && r.height > vh * 0.5) return false; // whole-section wrappers
    return getComputedStyle(el).display !== "inline";
  });
  const set = new Set(all);
  // Keep leaves: drop anything that contains another candidate.
  const leaves = all.filter((el) => {
    for (let p = el.parentElement; p; p = p.parentElement) set.has(p) && set.delete(p);
    return true;
  });
  const picked = leaves.filter((el) => set.has(el));
  // Too many tiny pieces looks like noise and costs frames — keep a random subset.
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }
  return picked.slice(0, MAX_PIECES);
}

function hud() {
  const el = document.createElement("div");
  el.setAttribute("role", "status");
  el.style.cssText =
    "position:fixed;left:50%;top:84px;z-index:115;transform:translateX(-50%);pointer-events:none;" +
    "font:500 12px/1.4 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.02em;width:max-content;max-width:calc(100vw - 32px);text-align:center;" +
    "padding:9px 14px;border-radius:999px;border:1px solid;backdrop-filter:blur(8px);transition:color .3s,border-color .3s,background .3s";
  const set = (text: string, tone: "bad" | "warn" | "ok") => {
    const c = tone === "bad" ? "#FF5A4F" : tone === "warn" ? "#FFB547" : "#93D3A2";
    el.textContent = text;
    el.style.color = c;
    el.style.borderColor = c + "66";
    el.style.background = "rgba(15,17,14,.86)";
  };
  document.body.appendChild(el);
  el.animate([{ opacity: 0, transform: "translate(-50%,-8px)" }, { opacity: 1, transform: "translate(-50%,0)" }], {
    duration: 250,
    easing: "ease-out",
  });
  return {
    set,
    remove: async () => {
      await el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: "forwards" }).finished.catch(() => {});
      el.remove();
    },
  };
}

export async function runChaos() {
  if (running) return;
  running = true;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pieces = pickPieces();
  const n = pieces.length || 1;
  const t0 = performance.now();
  const status = hud();
  status.set(`⚠ chaos experiment — terminating ${n} instances…`, "bad");

  // A short tremor first.
  const main = document.querySelector("main");
  if (!reduce)
    main?.animate(
      [0, -7, 6, -5, 4, -2, 0].map((x, i) => ({ transform: `translate(${x}px, ${i % 2 ? 2 : -2}px)` })),
      { duration: 420, easing: "linear" }
    );
  await wait(reduce ? 200 : 380);

  const vh = window.innerHeight;
  const falls = pieces.map((el) => {
    const r = el.getBoundingClientRect();
    const fallen = reduce
      ? "none"
      : `translate(${rand(-90, 90).toFixed(0)}px, ${(Math.max(60, vh - r.bottom) + rand(20, 260)).toFixed(0)}px) rotate(${rand(-55, 55).toFixed(0)}deg)`;
    const anim = el.animate(
      [
        { transform: "none", opacity: 1, easing: "ease-out" },
        { transform: `rotate(${rand(-6, 6).toFixed(1)}deg)`, opacity: 1, offset: 0.18, easing: "cubic-bezier(.55,0,1,.45)" },
        { transform: fallen, opacity: reduce ? 0.15 : 0.85 },
      ],
      { duration: rand(700, 1100), delay: rand(0, 650), fill: "forwards" }
    );
    return { el, fallen, anim, dead: reduce ? 0.15 : 0.85 };
  });
  await wait(1500);
  status.set(`✕ ${n}/${n} instances down · health checks failing`, "bad");
  await wait(1100);
  status.set("↻ auto-healing — replacing instances…", "warn");

  const heals = falls.map(({ el, fallen, anim, dead }) => {
    const heal = el.animate([{ transform: fallen, opacity: dead }, { transform: "none", opacity: 1 }], {
      duration: rand(650, 900),
      delay: rand(0, 600),
      easing: "cubic-bezier(.34,1.45,.64,1)",
      fill: "backwards",
    });
    anim.cancel();
    return heal.finished.catch(() => {});
  });
  await Promise.all(heals);

  const secs = ((performance.now() - t0) / 1000).toFixed(1);
  status.set(`✓ all systems green — recovered ${n} instances in ${secs} s`, "ok");
  unlock("chaos", `Took down ${n} components and the page healed itself in ${secs} s.`);
  await wait(2200);
  await status.remove();
  running = false;
}

/** Shake-to-break on phones. iOS only reports motion after a permission prompt, so there it's terminal-only. */
export function useShakeForChaos(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof DeviceMotionEvent === "undefined") return;
    let hits: number[] = [];
    let last = 0;
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.acceleration;
      if (!a || a.x == null || a.y == null || a.z == null) return;
      const mag = Math.hypot(a.x, a.y, a.z);
      const now = performance.now();
      if (mag < 17 || now - last < 120) return;
      last = now;
      hits = [...hits.filter((t) => now - t < 1200), now];
      if (hits.length >= 4) {
        hits = [];
        void runChaos();
      }
    };
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [enabled]);
}
