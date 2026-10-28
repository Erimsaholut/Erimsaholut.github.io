import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "./Logo";
import { EASE } from "./Section";
import { PROFILE } from "../data";

const LINKS = [
  { id: "about", label: "About" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "certifications", label: "Certifications" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
];

/** Two lines drawn by hand that turn into an X (and back) on the base curve. */
function MenuIcon({ open }: { open: boolean }) {
  const line = "absolute left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-current transition-transform duration-500";
  return (
    <span className="relative block h-4 w-4" aria-hidden>
      <span className={`${line} top-1 ${open ? "translate-y-[3px] rotate-45" : ""}`} />
      <span className={`${line} bottom-1 ${open ? "-translate-y-[3px] -rotate-45" : ""}`} />
    </span>
  );
}

// Tapping the name (or the logo next to it) five times within 2.5 s opens the hidden terminal.
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
  const [active, setActive] = useState("");

  // Current section, for the "you are here" state in both menus.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-40% 0px -55% 0px" }
    );
    ["top", ...LINKS.map((l) => l.id)].forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  // The full-height mobile menu owns the screen while it's open.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items = [...LINKS.map((l) => ({ ...l, cta: false })), { id: "contact", label: "Hire me", cta: true }];

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-line bg-surface/70 p-2 shadow-[0_16px_48px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <a
            href="#top"
            className="flex items-center gap-2 rounded-full py-1 pl-2 pr-3 text-ink transition-colors hover:bg-raised [-webkit-tap-highlight-color:transparent]"
            onClick={onLogo}
          >
            <Logo className="h-6 w-6" />
            <span className="text-sm font-semibold">{PROFILE.name}</span>
          </a>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Sections">
            {LINKS.map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                aria-current={active === l.id ? "location" : undefined}
                className={`rounded-full px-3 py-2 text-sm transition-colors active:scale-[0.98] ${
                  active === l.id ? "bg-raised text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <a
            href="#contact"
            className="hidden items-center rounded-full bg-amber px-3 py-2 text-sm font-semibold text-bg transition-colors hover:bg-amber/90 active:scale-[0.98] lg:inline-flex"
          >
            Hire me
          </a>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-raised active:scale-[0.98] lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed inset-0 z-40 overflow-y-auto bg-bg/95 px-4 pb-12 pt-24 backdrop-blur-2xl lg:hidden"
            aria-label="Sections"
          >
            <ul className="mx-auto flex max-w-md flex-col gap-2">
              {items.map((l, i) => (
                <motion.li
                  key={l.label}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  // 60 ms apart, never longer than 400 ms in total.
                  transition={{ duration: 0.5, ease: EASE, delay: Math.min(i * 0.06, 0.4) }}
                >
                  <a
                    href={`#${l.id}`}
                    onClick={() => setOpen(false)}
                    aria-current={!l.cta && active === l.id ? "location" : undefined}
                    className={
                      l.cta
                        ? "mt-6 flex items-center justify-center rounded-full bg-amber px-3 py-2 text-base font-semibold text-bg transition-colors hover:bg-amber/90 active:scale-[0.98]"
                        : `flex items-center justify-between rounded-2xl px-4 py-3 text-3xl font-semibold transition-colors active:scale-[0.98] ${
                            active === l.id ? "bg-raised text-ink" : "text-ink/80 hover:text-ink"
                          }`
                    }
                  >
                    {l.label}
                    {!l.cta && active === l.id && <span className="h-2 w-2 rounded-full bg-amber" aria-hidden />}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
