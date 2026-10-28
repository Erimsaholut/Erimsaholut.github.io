import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import SafeBoundary from "../three/SafeBoundary";
import { hasWebGL, isLiteDevice } from "../three/input";
import { EASE } from "./Section";
import { ArrowDown, Download, Moon, Pin } from "./Icons";
import { CountUp, Magnetic, Typewriter } from "./Effects";
import { CV_FILE, FOCUS_WORDS, PROFILE, STATS, cvUrl } from "../data";
import { unlock } from "../secrets/store";

const HeroGlobe = lazy(() => import("../three/HeroGlobe"));

// The last letter of the name is the easter-egg switch: each tap shifts its colour, the third opens the game.
// At rest it shares the heading's white-to-grey gradient.
const SECRET_COLORS = ["#FFB547", "#93D3A2", "#8FB0EC"];

const up = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: EASE },
});

export default function Hero({ onSecret }: { onSecret: () => void }) {
  const words = PROFILE.name.split(" ");
  const [taps, setTaps] = useState(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const onSecretTap = () => {
    const n = taps + 1;
    clearTimeout(resetTimer.current);
    if (n === 2) void import("../game/RegionDefender"); // start fetching the game early
    setTaps(n);
    if (n >= 3) {
      resetTimer.current = setTimeout(() => {
        setTaps(0);
        onSecret();
      }, 220);
      return;
    }
    resetTimer.current = setTimeout(() => setTaps(0), 4000);
  };
  const reduce = !!useReducedMotion();
  const localGlobe = useMemo(() => isLiteDevice() && hasWebGL(), []);

  // Night owl: visitors between 00:00 and 05:00 (their local time) get a greeting and a secret.
  const night = useMemo(() => {
    const now = new Date();
    const forced = import.meta.env.DEV && new URLSearchParams(location.search).has("night"); // dev-only test switch
    return now.getHours() < 5 || forced ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;
  }, []);
  useEffect(() => {
    if (!night) return;
    const t = setTimeout(() => unlock("night-owl", `Visited at ${night} — burning the midnight oil.`), 2600);
    return () => clearTimeout(t);
  }, [night]);

  return (
    <section id="top" className="relative overflow-hidden pt-24">
      <div className="relative mx-auto grid max-w-6xl gap-6 px-4 md:px-8 lg:min-h-[calc(100svh-15rem)] lg:grid-cols-12 lg:items-center">
        <div className="relative z-10 lg:col-span-6">
          <motion.div {...up(0.05)} className="mb-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-sage/30 bg-sage/10 px-3 py-1 text-xs font-medium text-sage">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-sage animate-ping2" />
                <span className="relative h-2 w-2 rounded-full bg-sage" />
              </span>
              Open to internships
            </span>
            <span className="inline-flex items-center gap-2 text-xs text-muted">
              <Pin className="w-4 h-4" /> {PROFILE.location}
            </span>
            {night && (
              <motion.span
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.6, ease: EASE }}
                className="inline-flex items-center gap-2 rounded-full border border-sky/30 bg-sky/10 px-3 py-1 text-xs text-sky"
                title={`It's ${night} where you are`}
              >
                <Moon className="w-4 h-4" />
                Burning the midnight oil?
              </motion.span>
            )}
          </motion.div>

          <h1 aria-label={PROFILE.name} className="max-w-[680px] text-5xl font-semibold tracking-tight sm:text-7xl lg:text-8xl">
            {words.map((word, wi) => {
              const last = wi === words.length - 1;
              return (
                <motion.span
                  key={word}
                  aria-hidden
                  className="block w-fit bg-gradient-to-r from-white to-[#9B9B9B] bg-clip-text pb-2 text-transparent"
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.15 + wi * 0.15, ease: EASE }}
                >
                  {last ? word.slice(0, -1) : word}
                  {last && (
                    <span
                      key={taps}
                      onClick={onSecretTap}
                      onMouseDown={(e) => e.detail > 1 && e.preventDefault()}
                      className={`cursor-default select-none transition-colors [-webkit-tap-highlight-color:transparent] ${taps ? "inline-block animate-pop" : ""}`}
                      style={taps ? { color: SECRET_COLORS[taps - 1] } : undefined}
                    >
                      {word.slice(-1)}
                    </span>
                  )}
                </motion.span>
              );
            })}
          </h1>

          <p className="sr-only">{PROFILE.tagline}</p>
          <motion.p {...up(0.6)} aria-hidden className="mt-6 max-w-[680px] text-lg text-muted">
            Computer Engineering student at {PROFILE.school}.
            <br />
            Focused on <Typewriter words={FOCUS_WORDS} />
          </motion.p>

          <motion.div {...up(0.75)} className="mt-8 flex flex-wrap items-center gap-3">
            <Magnetic>
              <a
                href="#projects"
                className="inline-flex items-center gap-2 rounded-md bg-amber px-3 py-2 text-base font-semibold text-bg shadow-[0_10px_40px_-10px_rgba(255,181,71,0.6)] transition-colors hover:bg-amber/90 active:scale-[0.98]"
              >
                See my projects <ArrowDown />
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href="#contact"
                className="inline-flex items-center rounded-md border border-line bg-surface/70 px-3 py-2 text-base font-semibold text-ink backdrop-blur transition-colors hover:border-ink/30 hover:bg-raised active:scale-[0.98]"
              >
                Get in touch
              </a>
            </Magnetic>
            <a
              href={cvUrl()}
              download={CV_FILE}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-base font-semibold text-muted transition-colors hover:bg-raised hover:text-ink active:scale-[0.98]"
            >
              <Download /> Download CV
            </a>
          </motion.div>
        </div>

        {/* Desktop: the page-wide WebGL layer draws the globe over this box. Phones: it gets its own canvas. */}
        <motion.div
          {...up(0.3)}
          data-globe-anchor
          className="relative mx-auto aspect-square w-full max-w-[600px] lg:col-span-6 lg:-mr-10"
          aria-hidden
        >
          {localGlobe && (
            <SafeBoundary>
              <Suspense fallback={null}>
                <HeroGlobe reduce={reduce} />
              </Suspense>
            </SafeBoundary>
          )}
        </motion.div>
      </div>

      <motion.dl {...up(0.9)} className="relative mx-auto mt-12 grid max-w-6xl grid-cols-2 gap-3 px-4 md:grid-cols-4 md:px-8">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-surface p-6">
            <dt className="sr-only">{s.label}</dt>
            <dd className="text-4xl font-semibold tracking-tight">
              <CountUp value={s.value} />
            </dd>
            <dd className="mt-2 text-sm text-muted">{s.label}</dd>
          </div>
        ))}
      </motion.dl>
    </section>
  );
}
