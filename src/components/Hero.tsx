import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import SafeBoundary from "../three/SafeBoundary";
import { hasWebGL, isLiteDevice } from "../three/input";
import { EASE } from "./Section";
import { ArrowDown, Pin } from "./Icons";
import { CountUp, Magnetic, Typewriter } from "./Effects";
import { FOCUS_WORDS, PROFILE, STATS } from "../data";

const HeroGlobe = lazy(() => import("../three/HeroGlobe"));

// The last letter of the name is the easter-egg switch: each tap shifts its colour, the third opens the game.
const SECRET_COLORS = ["#FFB547", "#93D3A2", "#8FB0EC", "#ECE8DF"];

const up = (delay: number) => ({
  initial: { opacity: 0, y: 22 },
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

  return (
    <section id="top" className="relative overflow-hidden pt-28 md:pt-32">
      <div className="graph-paper pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-amber/10 blur-[120px]" aria-hidden />

      <div className="relative mx-auto grid max-w-6xl gap-6 px-5 md:px-8 lg:min-h-[calc(100svh-15rem)] lg:grid-cols-12 lg:items-center">
        <div className="relative z-10 lg:col-span-6">
          <motion.div {...up(0.05)} className="mb-7 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-sage/30 bg-sage/10 px-3 py-1 text-xs font-medium text-sage backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-sage animate-ping2" />
                <span className="relative h-2 w-2 rounded-full bg-sage" />
              </span>
              Open to internships
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <Pin className="w-3.5 h-3.5" /> {PROFILE.location}
            </span>
          </motion.div>

          <h1
            aria-label={PROFILE.name}
            className="font-display font-semibold tracking-tight leading-[0.92] text-[clamp(3.4rem,10vw,7.5rem)] [perspective:900px]"
          >
            {words.map((word, wi) => (
              <span
                key={word}
                aria-hidden
                className={`block pb-2 ${wi === 1 ? "text-amber [text-shadow:0_0_48px_rgba(255,181,71,0.35)]" : ""}`}
              >
                {[...word].map((ch, ci) => {
                  const delay = 0.15 + wi * 0.28 + ci * 0.045;
                  const secret = wi === words.length - 1 && ci === word.length - 1;
                  if (secret) {
                    return (
                      <motion.span
                        key={ci}
                        onClick={onSecretTap}
                        onMouseDown={(e) => e.detail > 1 && e.preventDefault()}
                        className="inline-block origin-bottom cursor-default select-none [-webkit-tap-highlight-color:transparent]"
                        initial={{ opacity: 0, y: "55%", rotateX: -85, color: SECRET_COLORS[0] }}
                        animate={{ opacity: 1, y: 0, rotateX: 0, color: SECRET_COLORS[taps] }}
                        transition={{ default: { duration: 0.9, delay, ease: EASE }, color: { duration: 0.25 } }}
                        whileHover={{ y: -12, transition: { duration: 0.18 } }}
                      >
                        <span key={taps} className={`inline-block ${taps ? "animate-pop" : ""}`}>
                          {ch}
                        </span>
                      </motion.span>
                    );
                  }
                  return (
                    <motion.span
                      key={ci}
                      className="inline-block origin-bottom cursor-default"
                      initial={{ opacity: 0, y: "55%", rotateX: -85 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      transition={{ duration: 0.9, delay, ease: EASE }}
                      whileHover={{ y: -12, color: wi === 1 ? "#ECE8DF" : "#FFB547", transition: { duration: 0.18 } }}
                    >
                      {ch}
                    </motion.span>
                  );
                })}
              </span>
            ))}
          </h1>

          <p className="sr-only">{PROFILE.tagline}</p>
          <motion.p {...up(0.75)} aria-hidden className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Computer Engineering student at {PROFILE.school}.
            <br />
            Focused on <Typewriter words={FOCUS_WORDS} />
          </motion.p>

          <motion.div {...up(0.9)} className="mt-9 flex flex-wrap gap-3">
            <Magnetic>
              <a
                href="#projects"
                className="inline-flex items-center gap-2 rounded-md bg-amber px-5 py-3 text-sm font-semibold text-bg shadow-[0_10px_40px_-10px_rgba(255,181,71,0.6)] transition hover:bg-amber/90"
              >
                See my projects <ArrowDown />
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href="#contact"
                className="inline-flex items-center rounded-md border border-line bg-surface/70 px-5 py-3 text-sm font-medium text-ink backdrop-blur transition hover:border-ink/30"
              >
                Get in touch
              </a>
            </Magnetic>
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

      <motion.dl {...up(1)} className="relative mx-auto mt-6 grid max-w-6xl grid-cols-2 border-t border-line md:grid-cols-4 md:px-8">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className={`px-5 py-7 md:px-6 ${i % 2 === 1 ? "border-l border-line" : ""} ${i >= 2 ? "border-t border-line md:border-t-0" : ""} ${
              i === 2 ? "md:border-l" : ""
            } ${i === 0 ? "md:pl-0" : ""}`}
          >
            <dt className="sr-only">{s.label}</dt>
            <dd className="font-display text-4xl font-semibold tracking-tight">
              <CountUp value={s.value} />
            </dd>
            <dd className="mt-1 text-sm text-muted">{s.label}</dd>
          </div>
        ))}
      </motion.dl>
    </section>
  );
}
