import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { TAGLINE } from "../data";

/*
 * A large statement between sections. Words start muted and light up one at a time, in reading
 * order, as the block scrolls past a trigger line. Scrolling is read once per frame and only
 * while the section is on screen.
 */

const TRIGGER = 0.7; // the line words cross, as a fraction of the viewport height

export default function Tagline() {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = !!useReducedMotion();
  const lines = useMemo(() => TAGLINE.map((l) => l.split(" ")), []);
  const total = lines.flat().length;
  const [lit, setLit] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    let raf = 0;
    let listening = false;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const progress = (window.innerHeight * TRIGGER - r.top) / Math.max(1, r.height);
      setLit(Math.max(0, Math.min(total, Math.round(progress * total))));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !listening) window.addEventListener("scroll", onScroll, { passive: true });
      if (!e.isIntersecting && listening) window.removeEventListener("scroll", onScroll);
      listening = e.isIntersecting;
      update();
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduce, total]);

  let n = 0;
  return (
    <section aria-label="What I do" className="border-t border-line py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <p ref={ref} className="max-w-[680px] text-4xl font-semibold tracking-tight [text-wrap:balance] md:text-5xl">
          {lines.map((words, li) => (
            <span key={li} className="block">
              {words.map((w, wi) => {
                const on = reduce || n++ < lit;
                return (
                  <span key={wi} className={`transition-opacity duration-500 ${on ? "opacity-100" : "opacity-30"}`}>
                    {w}
                    {wi < words.length - 1 ? " " : ""}
                  </span>
                );
              })}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
