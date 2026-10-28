import { useEffect, useRef, useState } from "react";
import { useOnScreen } from "../three/useOnScreen";

/*
 * Signal: a tiny "tx" light in the footer that keeps blinking a word in Morse code.
 * Tap it to listen (beeps + the dots and dashes received so far). Typing the decoded
 * word into the terminal unlocks the secret — see the `akhisar` command. The only clue
 * that the terminal is involved is the invisible-ink line in the contact section.
 */

export const SIGNAL_WORD = "AKHISAR";
const MORSE: Record<string, string> = { A: ".-", H: "....", I: "..", K: "-.-", R: ".-.", S: "..." };
const UNIT = 210; // ms — slow enough to follow by eye

interface Step {
  on: boolean;
  units: number;
  /** Text to append to the received trail when this step starts. */
  add: string;
  first?: boolean;
}

// One loop of the message: dot = 1 unit on, dash = 3; gaps of 1 (inside a letter), 3 (between letters), 7 (before repeating).
const STEPS: Step[] = [...SIGNAL_WORD].flatMap((ch, li, word) => {
  const code = [...MORSE[ch]];
  return code.flatMap((sym, si): Step[] => {
    const lastSym = si === code.length - 1;
    const gap = !lastSym ? 1 : li === word.length - 1 ? 7 : 3;
    return [
      { on: true, units: sym === "." ? 1 : 3, add: sym, first: li === 0 && si === 0 },
      { on: false, units: gap, add: lastSym && li < word.length - 1 ? " " : "" },
    ];
  });
});

export default function Signal() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useOnScreen(ref, "0px");
  const [listening, setListening] = useState(false);
  const [lit, setLit] = useState(false);
  const [trail, setTrail] = useState("");
  const audio = useRef<AudioContext | null>(null);
  const listenRef = useRef(false);
  listenRef.current = listening;

  useEffect(() => {
    if (!visible && !listening) return;
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const s = STEPS[i];
      if (s.first) setTrail("");
      setLit(s.on);
      if (s.add) setTrail((t) => t + s.add);
      if (s.on && listenRef.current) beep(audio.current, (s.units * UNIT) / 1000);
      i = (i + 1) % STEPS.length;
      timer = setTimeout(tick, s.units * UNIT);
    };
    // Start from the beginning of the message so the trail always shows a whole word.
    timer = setTimeout(tick, 400);
    return () => {
      clearTimeout(timer);
      setLit(false);
    };
  }, [visible, listening]);

  useEffect(() => {
    if (!listening) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setListening(false);
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setListening(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [listening]);

  useEffect(() => () => void audio.current?.close().catch(() => {}), []);

  const toggle = () => {
    if (!listening) {
      try {
        audio.current ??= new AudioContext();
        void audio.current.resume();
      } catch {
        /* no audio — the light still works */
      }
    }
    setListening((l) => !l);
  };

  return (
    <div ref={ref} className="md:relative">
      <button
        onClick={toggle}
        aria-expanded={listening}
        aria-label="A small light that keeps blinking"
        className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-medium text-faint transition-colors hover:text-muted active:scale-[0.98] [-webkit-tap-highlight-color:transparent]"
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: lit ? "#93D3A2" : "#2E3A30", boxShadow: lit ? "0 0 10px 2px rgba(147,211,162,.65)" : "none" }}
        />
        tx
      </button>
      {listening && (
        <div
          role="status"
          className="absolute bottom-full left-0 z-20 mb-2 w-[min(17rem,calc(100vw-2.5rem))] rounded-xl border border-line bg-surface/95 p-3 text-left shadow-2xl backdrop-blur md:left-1/2 md:-translate-x-1/2"
        >
          <p className="text-xs font-medium text-faint">Incoming transmission</p>
          <p className="mt-2 min-h-6 break-all font-mono text-base tracking-wider text-amber">
            {trail.replace(/\./g, "·").replace(/-/g, "−")}
            <span className="ml-0.5 inline-block w-2 animate-blink text-faint">▍</span>
          </p>
          <p className="mt-2 text-xs text-muted">♪ Listening. It repeats every few seconds.</p>
        </div>
      )}
    </div>
  );
}

function beep(ctx: AudioContext | null, seconds: number) {
  if (!ctx || ctx.state !== "running") return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 620;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.07, t + 0.01);
  gain.gain.setValueAtTime(0.07, t + seconds - 0.015);
  gain.gain.linearRampToValueAtTime(0, t + seconds);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + seconds + 0.02);
}
