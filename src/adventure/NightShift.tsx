import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { gameOverlay } from "../three/gameOverlay";
import { unlock } from "../secrets/store";
import { COMPANIONS, ENDINGS, ENDING_ORDER, ITEMS, MAX_HP, SCENES, START, ZERO_AFTER, clock, type Choice, type EndingId, type State } from "./story";

/* BUZLIME: NIGHT SHIFT — the text adventure's screen. Progress and found endings stay in this browser. */

type Entry = { k: "scene"; id: string; text: string } | { k: "pick"; text: string } | { k: "say"; text: string };
interface Save {
  scene: string;
  state: State;
  log: Entry[];
}

const SAVE_KEY = "eo-nightshift-v1";
const ENDINGS_KEY = "eo-nightshift-endings";
const CPS = 260; // typewriter speed, characters per second

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode — no saving */
  }
}

const LOCATIONS: Record<string, string> = {
  intro: "the office",
  headphones: "the office",
  coffee: "the office",
  radio: "the office",
  cams: "the office",
  hall: "the hallway",
  gate: "the front gate",
  dock: "the loading dock",
  workshop: "the workshop",
  coldroom: "the cold room",
  crate: "the cold room",
  tape: "the office",
  server: "the server room",
  server_in: "the server room",
};

export default function NightShift({ onClose }: { onClose: () => void }) {
  const reduce = !!useReducedMotion();
  const saved = useMemo(() => {
    const s = read<Save | null>(SAVE_KEY, null);
    return s && SCENES[s.scene] && !SCENES[s.scene].ending ? s : null;
  }, []);
  const [started, setStarted] = useState(false);
  const [scene, setScene] = useState("intro");
  const [state, setState] = useState<State>(START);
  const [log, setLog] = useState<Entry[]>([]);
  const [shown, setShown] = useState(Infinity); // characters of the newest scene revealed so far
  const [endings, setEndings] = useState<EndingId[]>(() => read<EndingId[]>(ENDINGS_KEY, []));
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);

  const current = SCENES[scene];
  const lastScene = [...log].reverse().find((e) => e.k === "scene");
  const typing = started && !!lastScene && shown < lastScene.text.length;
  const ending = current.ending && !typing ? current.ending : null;

  // Opening the game is itself an achievement. Lock the page and pause the site's 3D while open.
  useEffect(() => {
    unlock("night-shift");
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    gameOverlay.set(true);
    const prevFocus = document.activeElement as HTMLElement | null;
    root.current?.focus();
    return () => {
      html.style.overflow = prev;
      gameOverlay.set(false);
      prevFocus?.focus?.();
    };
  }, []);

  // Typewriter.
  useEffect(() => {
    if (!lastScene || shown >= lastScene.text.length) return;
    const id = setInterval(() => setShown((n) => n + Math.ceil(CPS / 30)), 1000 / 30);
    return () => clearInterval(id);
  }, [lastScene, shown]);

  // Keep the newest text in view.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown, log, ending]);

  // Persist progress (cleared at an ending, so the next visit starts fresh).
  useEffect(() => {
    if (!started) return;
    write(SAVE_KEY, current.ending ? null : ({ scene, state, log: log.slice(-40) } satisfies Save));
  }, [started, scene, state, log, current.ending]);

  // Record endings.
  useEffect(() => {
    if (!ending) return;
    setEndings((e) => {
      const next = e.includes(ending) ? e : [...e, ending];
      write(ENDINGS_KEY, next);
      return next;
    });
    if (ending === "best") unlock("best-ending");
    if (ending === "zero") unlock("patient-zero");
  }, [ending]);

  const enter = useCallback(
    (id: string, s: State, extra: Entry[] = []) => {
      const text = SCENES[id].text(s);
      setScene(id);
      setState(s);
      setLog((l) => [...l, ...extra, { k: "scene", id, text }]);
      setShown(reduce ? Infinity : 0);
    },
    [reduce]
  );

  const begin = (fromSave: boolean) => {
    setStarted(true);
    if (fromSave && saved) {
      setScene(saved.scene);
      setState(saved.state);
      setLog([...saved.log, { k: "say", text: "— shift resumed —" }]);
      setShown(Infinity);
      return;
    }
    setLog([]);
    enter("intro", { ...START, items: [], flags: [], seen: endings });
  };

  const choose = (c: Choice) => {
    if (typing) return setShown(Infinity);
    const s: State = { ...state, items: [...state.items], flags: [...state.flags] };
    let to = c.run?.(s) || c.to;
    if (s.hp <= 0) to = "end_bitten";
    if (s.hp < state.hp && flash.current && !reduce)
      flash.current.animate([{ opacity: 0.55 }, { opacity: 0 }], { duration: 650, easing: "ease-out" });
    const pick: Entry = { k: "pick", text: c.label };
    if (to === scene) {
      setState(s);
      setLog((l) => [...l, pick, ...(c.say ? [{ k: "say", text: c.say } as Entry] : [])]);
      return;
    }
    s.minutes += SCENES[to].mins ?? 4;
    enter(to, s, [pick, ...(c.say ? [{ k: "say", text: c.say } as Entry] : [])]);
  };

  const restart = () => {
    write(SAVE_KEY, null);
    setStarted(false);
    setLog([]);
    setScene("intro");
    setState(START);
  };

  const choices = useMemo(() => (current.choices ?? []).filter((c) => !c.when || c.when(state)), [current, state]);

  // Keyboard: number keys pick, Enter/Space skip the typewriter, Esc closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (!started) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          begin(!!saved);
        }
        return;
      }
      if (typing && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        setShown(Infinity);
        return;
      }
      const n = Number(e.key);
      if (n >= 1 && n <= choices.length) {
        const c = choices[n - 1];
        if (!c.need || c.need(state)) choose(c);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <motion.div
      ref={root}
      tabIndex={-1}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#0A0807] text-ink outline-none"
      role="dialog"
      aria-modal="true"
      aria-label="Buzlime: Night Shift"
    >
      {/* Emergency lighting, scanlines and the damage flash. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] animate-[alarm_3.2s_ease-in-out_infinite] bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(255,60,40,0.22),transparent_70%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.025)_0_1px,transparent_1px_3px)]" aria-hidden />
      <div ref={flash} className="pointer-events-none absolute inset-0 bg-[#FF2A1A] opacity-0" aria-hidden />

      <header className="relative z-10 flex items-center gap-3 border-b border-white/10 px-4 py-3 font-mono text-xs sm:px-6">
        <span className="hidden text-[#FF6A55] sm:inline">● REC</span>
        <span className="whitespace-nowrap tracking-[0.2em] text-muted">
          <span className="hidden sm:inline">
            BUZLIME<span className="text-[#FF6A55]">:</span>{" "}
          </span>
          NIGHT SHIFT
        </span>
        {started && (
          <>
            <span className="ml-auto text-amber" aria-label="Time">
              {clock(state.minutes)}
            </span>
            <span className="tracking-wider" aria-label={`Health ${state.hp} of ${MAX_HP}`}>
              {Array.from({ length: MAX_HP }, (_, i) => (
                <span key={i} className={i < state.hp ? "text-[#FF5A4F]" : "text-white/15"}>
                  ♥
                </span>
              ))}
            </span>
            <button onClick={restart} className="rounded-md px-2 py-1 text-muted transition hover:bg-white/5 hover:text-ink" title="Start over">
              ↺
            </button>
          </>
        )}
        <button onClick={onClose} aria-label="Close game" className={`rounded-md px-2 py-1 text-muted transition hover:bg-white/5 hover:text-ink ${started ? "" : "ml-auto"}`}>
          <span className="hidden sm:inline">esc </span>✕
        </button>
      </header>

      {started && (state.items.length > 0 || state.flags.some((f) => COMPANIONS[f])) && (
        <div className="relative z-10 flex flex-wrap gap-1.5 border-b border-white/5 px-4 py-2 font-mono text-[11px] sm:px-6">
          {state.items.map((i) => (
            <span key={i} className="rounded border border-white/10 bg-white/[0.03] px-2 py-0.5 text-ink/80">
              {ITEMS[i]}
            </span>
          ))}
          {state.flags
            .filter((f) => COMPANIONS[f])
            .map((f) => (
              <span key={f} className="rounded border border-sage/25 bg-sage/10 px-2 py-0.5 text-sage">
                + {COMPANIONS[f]}
              </span>
            ))}
        </div>
      )}

      {!started ? (
        <TitleScreen saved={saved} endings={endings} onStart={begin} />
      ) : (
        <div
          ref={scroller}
          className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-4 pb-10 pt-6 sm:px-6"
          onClick={() => typing && setShown(Infinity)}
        >
          <div className="mx-auto max-w-2xl space-y-5">
            {log.map((e, i) => {
              const latest = e === lastScene;
              if (e.k === "pick")
                return (
                  <p key={i} className="font-mono text-sm text-amber/80">
                    › {e.text}
                  </p>
                );
              if (e.k === "say")
                return (
                  <p key={i} className="font-mono text-[13px] italic text-sage/90">
                    {e.text}
                  </p>
                );
              return <Passage key={i} text={latest ? e.text.slice(0, shown) : e.text} dim={!latest} />;
            })}

            {!typing && !ending && (
              <motion.ol initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-2 pt-2">
                {choices.map((c, i) => {
                  const locked = !!c.need && !c.need(state);
                  return (
                    <li key={c.label}>
                      <button
                        disabled={locked}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          choose(c);
                        }}
                        className={`group flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left font-mono text-sm transition ${
                          locked ? "cursor-not-allowed border-white/5 text-faint" : "border-white/10 bg-white/[0.02] text-ink hover:border-amber/50 hover:bg-amber/[0.06] active:scale-[0.99]"
                        }`}
                      >
                        <span className={locked ? "text-faint" : "text-amber"}>{locked ? "🔒" : `${i + 1}.`}</span>
                        <span>
                          {c.label}
                          {locked && c.why && <span className="mt-0.5 block text-xs text-faint">{c.why}.</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </motion.ol>
            )}

            {ending && <EndingCard id={ending} endings={endings} onAgain={restart} onClose={onClose} />}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function Passage({ text, dim }: { text: string; dim: boolean }) {
  return (
    <div className={`space-y-3 text-[15.5px] leading-relaxed sm:text-base ${dim ? "text-ink/45" : "text-ink/90"}`}>
      {text.split("\n\n").map((p, i) => {
        // "LABEL — rest" lines (camera feeds, alerts) get a highlighted label.
        const m = p.match(/^([A-Z0-9][A-Z0-9 :.°−-]{3,}) — ([\s\S]*)$/);
        if (m)
          return (
            <p key={i}>
              <span className="font-mono text-[13px] tracking-wider text-[#FF8A75]">{m[1]}</span> — {m[2]}
            </p>
          );
        if (/^deploy /.test(p.trim()) || /^You type:/.test(p))
          return (
            <p key={i} className="font-mono text-sm text-sage">
              {p}
            </p>
          );
        if (/^[A-Z :.,'!]{12,}$/.test(p.trim()))
          return (
            <p key={i} className="font-display text-xl font-semibold tracking-tight text-amber">
              {p}
            </p>
          );
        return <p key={i}>{p}</p>;
      })}
    </div>
  );
}

function TitleScreen({ saved, endings, onStart }: { saved: Save | null; endings: EndingId[]; onStart: (fromSave: boolean) => void }) {
  return (
    <div className="relative z-10 flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-10 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-[#FF6A55]">📟 Incoming page · 02:47</p>
      <h1 className="mt-5 font-display text-[clamp(2.8rem,11vw,6rem)] font-semibold leading-[0.9] tracking-tight">
        BUZLIME
        <span className="block text-[#FF5A4F] [text-shadow:0_0_40px_rgba(255,70,50,0.45)]">NIGHT SHIFT</span>
      </h1>
      <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted">
        You're on call at the Buzlime warehouse. The update is stuck at 63%. Something is wrong outside. Your choices shape the story — and some endings
        need a little luck.
      </p>
      <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
        {saved && (
          <button onClick={() => onStart(true)} className="rounded-md bg-amber px-6 py-3 font-mono text-sm font-semibold text-bg transition hover:bg-amber/90">
            Continue · {clock(saved.state.minutes)}, {LOCATIONS[saved.scene] ?? "the warehouse"}
          </button>
        )}
        <button
          onClick={() => onStart(false)}
          className={`rounded-md px-6 py-3 font-mono text-sm font-semibold transition ${
            saved ? "border border-white/15 text-ink hover:border-white/30" : "bg-[#FF5A4F] text-[#120807] hover:bg-[#FF6F63]"
          }`}
        >
          {saved ? "New shift" : "Clock in →"}
        </button>
      </div>
      {endings.length >= ZERO_AFTER && !endings.includes("zero") && (
        <p className="mt-8 font-mono text-[11px] text-[#FF8A75]">📼 There's something new on the security tapes tonight.</p>
      )}
      <p className={`${endings.length >= ZERO_AFTER && !endings.includes("zero") ? "mt-2" : "mt-8"} font-mono text-[11px] text-faint`}>
        Endings found: {endings.length}/{ENDING_ORDER.length} · 1–9 to choose · esc to leave
      </p>
    </div>
  );
}

function EndingCard({ id, endings, onAgain, onClose }: { id: EndingId; endings: EndingId[]; onAgain: () => void; onClose: () => void }) {
  const e = ENDINGS[id];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`mt-4 rounded-2xl border p-6 text-center ${id === "bad" ? "border-[#FF5A4F]/30 bg-[#FF5A4F]/[0.06]" : "border-amber/30 bg-amber/[0.06]"}`}
    >
      <p className="text-4xl">{e.emoji}</p>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.3em] text-muted">The end · {e.kind}</p>
      <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">{e.title}</h2>
      <ul className="mx-auto mt-5 grid max-w-md grid-cols-1 gap-1.5 text-left font-mono text-xs sm:grid-cols-2">
        {ENDING_ORDER.map((k) => {
          const got = endings.includes(k);
          return (
            <li key={k} className={`rounded-lg border px-3 py-2 ${got ? "border-white/15 text-ink" : "border-white/5 text-faint"} ${k === id ? "border-amber/50" : ""}`}>
              {got ? `${ENDINGS[k].emoji} ${ENDINGS[k].title}` : `🔒 ??? · ${ENDINGS[k].kind}`}
            </li>
          );
        })}
      </ul>
      <p className="mt-4 font-mono text-[11px] text-faint">
        Endings found: {endings.length}/{ENDING_ORDER.length}
        {!endings.includes("best") && id !== "best" ? " · the best ending brings everyone home" : ""}
      </p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <button onClick={onAgain} className="rounded-md bg-amber px-5 py-2.5 font-mono text-sm font-semibold text-bg transition hover:bg-amber/90">
          Play again
        </button>
        <button onClick={onClose} className="rounded-md border border-white/15 px-5 py-2.5 font-mono text-sm text-ink transition hover:border-white/30">
          Back to the site
        </button>
      </div>
    </motion.div>
  );
}

