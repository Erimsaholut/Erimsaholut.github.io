import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ALIASES, COMMANDS, FILES, type Ctx } from "./commands";
import { unlock } from "../secrets/store";
import { isLiteDevice } from "../three/input";

const PROMPT = "erimsah@torino:~$";
const QUICK = ["help", "whoami", "neofetch", "projects", "ls -a", "sudo hire erimsah", "play"];
const EXPLORER_GOAL = 8;

interface Line {
  id: number;
  node: ReactNode;
}

/** Green "digital rain" over the terminal for a few seconds. */
function Matrix({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    const r = c.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = r.width * dpr;
    c.height = r.height * dpr;
    ctx.scale(dpr, dpr);
    const size = 15;
    const cols = Math.ceil(r.width / size);
    const drops = Array.from({ length: cols }, () => Math.random() * -40);
    const chars = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ0123456789AWSCLOUD<>/{}";
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      ctx.fillStyle = "rgba(11,13,10,0.12)";
      ctx.fillRect(0, 0, r.width, r.height);
      ctx.font = `${size}px "JetBrains Mono", monospace`;
      drops.forEach((y, i) => {
        ctx.fillStyle = Math.random() > 0.96 ? "#ECE8DF" : "#93D3A2";
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * size, y * size);
        drops[i] = y * size > r.height && Math.random() > 0.97 ? 0 : y + 1;
      });
      if (now - start < 4200) raf = requestAnimationFrame(tick);
      else onDone();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />;
}

export default function Terminal({ onClose, onPlay }: { onClose: () => void; onPlay: () => void }) {
  const lite = useMemo(() => isLiteDevice(), []);
  const [lines, setLines] = useState<Line[]>([]);
  const [value, setValue] = useState("");
  const [matrix, setMatrix] = useState(false);
  const [busy, setBusy] = useState(false);
  const [vh, setVh] = useState(() => window.visualViewport?.height ?? window.innerHeight);
  const nextId = useRef(0);
  const history = useRef<string[]>([]);
  const histPos = useRef(-1);
  const used = useRef(new Set<string>());
  const startedAt = useRef(performance.now());
  const input = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const prevOverflow = useRef<string | null>(null);
  const unlockScroll = () => {
    if (prevOverflow.current === null) return;
    document.documentElement.style.overflow = prevOverflow.current;
    prevOverflow.current = null;
  };

  const print = useCallback((...nodes: ReactNode[]) => {
    setLines((ls) => [...ls, ...nodes.map((node) => ({ id: nextId.current++, node }))]);
  }, []);

  // Release the page scroll right away (not after the exit animation) so follow-up scrolling works.
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    unlockScroll();
    onClose();
  }, [onClose]);

  // Welcome banner (guarded so React StrictMode doesn't print it twice).
  const welcomed = useRef(false);
  useEffect(() => {
    if (welcomed.current) return;
    welcomed.current = true;
    print(
      <span key="w1" className="text-amber">
        Welcome to erimsah-sh 1.0 — a tiny shell inside a portfolio.
      </span>,
      <span key="w2" className="text-muted">
        Type <span className="text-amber">help</span> to see what you can do{lite ? ", or tap a command below" : ""}.
      </span>,
      ""
    );
    if (!lite) input.current?.focus();
  }, [print, lite]);

  // Keep the panel above the on-screen keyboard on phones.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => setVh(vv.height);
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  // Lock page scroll while open; Esc closes.
  useEffect(() => {
    const html = document.documentElement;
    prevOverflow.current = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      unlockScroll();
      window.removeEventListener("keydown", onKey);
    };
  }, [close]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [lines]);

  const run = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      print(
        <span key="in">
          <span className="text-sage">{PROMPT}</span> {text}
        </span>
      );
      if (!text) return;
      history.current = [...history.current, text].slice(-50);
      histPos.current = -1;
      const [first, ...args] = text.split(/\s+/);
      const name = ALIASES[first.toLowerCase()] ?? first.toLowerCase();
      const cmd = COMMANDS[name];
      if (!cmd) {
        print(
          <span key="nf" className="text-[#FF5A4F]">
            command not found: {first} — try <span className="text-amber">help</span>
          </span>
        );
        return;
      }
      used.current.add(name);
      if (used.current.size >= EXPLORER_GOAL) unlock("explorer");
      const ctx: Ctx = {
        print,
        clear: () => setLines([]),
        close,
        openGame: () => {
          close();
          onPlay();
        },
        matrix: () => setMatrix(true),
        history: history.current,
        startedAt: startedAt.current,
      };
      setBusy(true);
      try {
        await cmd.run(args, ctx);
      } finally {
        setBusy(false);
        print("");
      }
    },
    [print, close, onPlay]
  );

  const complete = () => {
    const parts = value.split(/\s+/);
    if (parts.length === 1) {
      const opts = Object.keys(COMMANDS).filter((c) => !COMMANDS[c].hidden && c.startsWith(parts[0].toLowerCase()));
      if (opts.length === 1) setValue(opts[0] + " ");
      else if (opts.length > 1) print(<span key="c" className="text-muted">{opts.join("   ")}</span>);
      return;
    }
    if (parts[0] === "cat") {
      const last = parts[parts.length - 1];
      const opts = Object.keys(FILES).filter((f) => f.startsWith(last) && (last.startsWith(".") || !f.startsWith(".")));
      if (opts.length === 1) setValue([...parts.slice(0, -1), opts[0]].join(" "));
      else if (opts.length > 1) print(<span key="c" className="text-muted">{opts.join("   ")}</span>);
    }
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.code === "Backquote") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (busy) return;
      const v = value;
      setValue("");
      void run(v);
    } else if (e.key === "Tab") {
      e.preventDefault();
      complete();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const h = history.current;
      if (!h.length) return;
      histPos.current = histPos.current < 0 ? h.length - 1 : Math.max(0, histPos.current - 1);
      setValue(h[histPos.current]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const h = history.current;
      if (histPos.current < 0) return;
      histPos.current += 1;
      if (histPos.current >= h.length) {
        histPos.current = -1;
        setValue("");
      } else setValue(h[histPos.current]);
    } else if (e.key.toLowerCase() === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  const height = lite ? Math.max(320, vh - 12) : Math.min(window.innerHeight * 0.62, 620);

  return (
    <motion.div
      className="fixed inset-0 z-[105]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Terminal"
    >
      <div className="absolute inset-0 bg-bg/40" onClick={close} />
      <motion.div
        initial={{ y: "-105%" }}
        animate={{ y: 0 }}
        exit={{ y: "-105%" }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        style={{ height }}
        className="absolute inset-x-0 top-0 mx-auto flex max-w-4xl flex-col overflow-hidden rounded-b-2xl border border-t-0 border-amber/25 bg-[#0B0D0A]/95 font-mono text-[13px] leading-relaxed text-ink shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:text-sm"
        onClick={() => !lite && input.current?.focus()}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <span className="text-xs text-muted">erimsah@torino: ~</span>
          <button onClick={close} aria-label="Close terminal" className="rounded-md px-2 py-1 text-xs text-muted transition hover:bg-raised hover:text-ink">
            esc ✕
          </button>
        </div>

        <div ref={scroller} className="relative flex-1 overflow-y-auto px-4 py-3">
          {lines.map((l) => (
            <div key={l.id} className="min-h-[1.3em] whitespace-pre-wrap break-words">
              {l.node}
            </div>
          ))}
          {matrix && <Matrix onDone={() => setMatrix(false)} />}
        </div>

        {lite && (
          <div className="flex gap-2 overflow-x-auto border-t border-line px-3 py-2 [scrollbar-width:none]">
            {QUICK.map((q) => (
              <button
                key={q}
                disabled={busy}
                onClick={() => void run(q)}
                className="shrink-0 rounded-md border border-line bg-raised px-2.5 py-1.5 text-xs text-ink/90 active:border-amber/60"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <label className="flex items-center gap-2 border-t border-line px-4 py-3">
          <span className="shrink-0 text-sage">{lite ? "~$" : PROMPT}</span>
          <input
            ref={input}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="send"
            aria-label="Terminal input"
            className="min-w-0 flex-1 bg-transparent text-ink caret-amber outline-none placeholder:text-faint"
            placeholder={lite ? "type a command…" : ""}
          />
        </label>
      </motion.div>
    </motion.div>
  );
}
