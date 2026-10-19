import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "./Logo";
import { Close, Menu } from "./Icons";
import { PROFILE } from "../data";

const LINKS = [
  { id: "about", label: "About" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "certifications", label: "Certifications" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
];

export default function Nav({ onLogoSecret }: { onLogoSecret?: () => void }) {
  const logoTaps = useRef<number[]>([]);
  const onLogo = () => {
    setOpen(false);
    const now = Date.now();
    logoTaps.current = [...logoTaps.current.filter((t) => now - t < 2500), now];
    if (logoTaps.current.length >= 5) {
      logoTaps.current = [];
      onLogoSecret?.();
    }
  };
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-40% 0px -55% 0px" }
    );
    ["top", ...LINKS.map((l) => l.id)].forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => {
      window.removeEventListener("scroll", onScroll);
      obs.disconnect();
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open ? "bg-bg/80 backdrop-blur-lg border-b border-line" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
        <a href="#top" className="flex items-center gap-2.5 text-ink [-webkit-tap-highlight-color:transparent]" onClick={onLogo}>
          <Logo />
          <span className="font-display text-[17px] font-semibold tracking-tight">{PROFILE.name}</span>
        </a>

        <nav className="hidden lg:flex items-center gap-1" aria-label="Sections">
          {LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                active === l.id ? "text-ink bg-raised" : "text-muted hover:text-ink"
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <a
          href="#contact"
          className="hidden lg:inline-flex items-center rounded-md bg-amber px-4 py-2 text-sm font-medium text-bg hover:bg-amber/90 transition-colors"
        >
          Hire me
        </a>

        <button
          className="lg:hidden -mr-2 p-2 text-ink"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <Close className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden overflow-hidden border-t border-line"
            aria-label="Sections"
          >
            <div className="mx-auto max-w-6xl px-5 py-4 flex flex-col">
              {LINKS.map((l) => (
                <a
                  key={l.id}
                  href={`#${l.id}`}
                  onClick={() => setOpen(false)}
                  className="py-3 font-display text-2xl text-ink/90 hover:text-amber border-b border-line last:border-0"
                >
                  {l.label}
                </a>
              ))}
              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className="mt-4 inline-flex items-center justify-center rounded-md bg-amber px-5 py-3 text-base font-semibold text-bg transition-colors hover:bg-amber/90"
              >
                Hire me
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
