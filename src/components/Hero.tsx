import { motion } from "framer-motion";
import NotebookCard from "./NotebookCard";
import { EASE } from "./Section";
import { ArrowDown, Pin } from "./Icons";
import { PROFILE, STATS } from "../data";

const up = (delay: number) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: EASE },
});

export default function Hero() {
  const [first, last] = PROFILE.name.split(" ");

  return (
    <section id="top" className="relative overflow-hidden pt-28 md:pt-36">
      <div className="graph-paper pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-amber/10 blur-[120px]"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 md:px-8 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <motion.div {...up(0.05)} className="mb-7 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-sage/30 bg-sage/10 px-3 py-1 text-xs font-medium text-sage">
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

          <h1 className="font-display font-semibold tracking-tight leading-[0.92] text-[clamp(3.4rem,10vw,7.5rem)]">
            {[first, last].map((word, i) => (
              <span key={word} className="block overflow-hidden pb-2">
                <motion.span
                  className={`block ${i === 1 ? "text-amber" : ""}`}
                  initial={{ y: "105%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1, delay: 0.15 + i * 0.1, ease: EASE }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p {...up(0.45)} className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            {PROFILE.tagline}
          </motion.p>

          <motion.div {...up(0.55)} className="mt-9 flex flex-wrap gap-3">
            <a
              href="#projects"
              className="inline-flex items-center gap-2 rounded-md bg-amber px-5 py-3 text-sm font-semibold text-bg transition hover:bg-amber/90"
            >
              See my projects <ArrowDown />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center rounded-md border border-line bg-surface px-5 py-3 text-sm font-medium text-ink transition hover:border-ink/30"
            >
              Get in touch
            </a>
          </motion.div>
        </div>

        <motion.div
          className="lg:col-span-5"
          initial={{ opacity: 0, y: 30, rotate: 1.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 1, delay: 0.35, ease: EASE }}
        >
          <NotebookCard />
        </motion.div>
      </div>

      <motion.dl
        {...up(0.7)}
        className="relative mx-auto mt-14 grid max-w-6xl grid-cols-2 border-t border-line md:grid-cols-4 md:px-8"
      >
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className={`px-5 py-7 md:px-6 ${i % 2 === 1 ? "border-l border-line" : ""} ${i >= 2 ? "border-t border-line md:border-t-0" : ""} ${
              i === 2 ? "md:border-l" : ""
            } ${i === 0 ? "md:pl-0" : ""}`}
          >
            <dt className="sr-only">{s.label}</dt>
            <dd className="font-display text-4xl font-semibold tracking-tight">{s.value}</dd>
            <dd className="mt-1 text-sm text-muted">{s.label}</dd>
          </div>
        ))}
      </motion.dl>
    </section>
  );
}
