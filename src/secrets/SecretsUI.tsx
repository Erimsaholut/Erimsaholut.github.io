import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CLASSIFIED_HINT, SECRETS } from "./registry";
import { dismissToast, resetSecrets, useSecrets } from "./store";
import { confetti } from "./confetti";

const EASE = [0.22, 1, 0.36, 1] as const;

function Lock({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d={open ? "M8 11V8a4 4 0 0 1 7.5-2" : "M8 11V8a4 4 0 0 1 8 0v3"} />
    </svg>
  );
}

/** "Secret found" pop-ups. Sits above everything, including the game. */
export function SecretToasts() {
  const { toasts } = useSecrets();
  const total = SECRETS.length;
  const current = toasts[0];
  const count = current?.n ?? 0;

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => dismissToast(current.key), 3800);
    if (count === total) confetti(window.innerWidth / 2, window.innerHeight - 90);
    return () => clearTimeout(t);
  }, [current, count, total]);

  const def = current && SECRETS.find((s) => s.id === current.id);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[120] flex justify-center px-4 sm:inset-x-auto sm:right-5 sm:justify-end" aria-live="polite">
      <AnimatePresence mode="wait">
        {def && current && (
          <motion.button
            key={current.key}
            onClick={() => dismissToast(current.key)}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl border border-amber/40 bg-surface/95 px-4 py-3 text-left shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-xl"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber text-bg">
              <Lock open />
            </span>
            <span className="min-w-0">
              <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-amber">
                Secret found · {count}/{total}
              </span>
              <span className="block truncate text-sm font-semibold text-ink">{def.title}</span>
              <span className="block truncate text-xs text-muted">{count === total ? "You found every secret. Legend. 🏆" : current.detail ?? def.found}</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Footer counter — opens the secrets panel. */
export function SecretsBadge({ onOpen }: { onOpen: () => void }) {
  const { found } = useSecrets();
  const count = Object.keys(found).length;
  const total = SECRETS.length;
  const done = count === total;
  return (
    <button
      onClick={onOpen}
      className={`group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] transition hover:border-amber/50 hover:text-amber ${
        done ? "border-amber/40 bg-amber/10 text-amber shadow-[0_0_24px_-6px_rgba(255,181,71,0.6)]" : "border-line text-faint"
      }`}
    >
      <span className={count ? "text-amber" : ""}>◆</span>
      {done ? `${count}/${total} · certified secret hunter` : `${count}/${total} secrets found`}
    </button>
  );
}

/** List of every secret: found ones with details, locked ones with a hint. */
export function SecretsPanel({ open, onClose, onReward }: { open: boolean; onClose: () => void; onReward: () => void }) {
  const { found } = useSecrets();
  const count = Object.keys(found).length;
  const total = SECRETS.length;
  const closeRef = useRef<HTMLButtonElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (!open) return;
    setConfirmReset(false);
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-end justify-center bg-bg/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Secrets"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88svh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-line bg-surface p-6 sm:rounded-3xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Easter eggs</p>
                <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">
                  {count === total ? "All secrets found 🏆" : "Secrets"}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {count}/{total} found{count < total ? " — the hints below might help." : ". Thanks for exploring!"}
                </p>
              </div>
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg border border-line p-2 text-muted transition hover:text-ink"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            {count === total && (
              <button
                onClick={onReward}
                className="mt-5 flex w-full items-center justify-between gap-3 rounded-2xl border border-amber/40 bg-amber/10 px-4 py-3 text-left transition hover:bg-amber/15"
              >
                <span>
                  <span className="block text-sm font-semibold text-amber">🏆 Your reward is waiting</span>
                  <span className="block text-xs text-muted">Get your Certified Secret Hunter certificate</span>
                </span>
                <span className="text-amber">→</span>
              </button>
            )}

            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-line">
              <motion.div className="h-full rounded-full bg-amber" initial={false} animate={{ width: `${(count / total) * 100}%` }} transition={{ duration: 0.6, ease: EASE }} />
            </div>

            <ul className="mt-6 space-y-2.5">
              {SECRETS.map((s) => {
                const at = found[s.id];
                return (
                  <li
                    key={s.id}
                    className={`flex gap-3 rounded-2xl border p-3.5 ${at ? "border-amber/30 bg-amber/[0.06]" : "border-line bg-raised/60"}`}
                  >
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${at ? "bg-amber text-bg" : "border border-line text-faint"}`}
                    >
                      <Lock open={!!at} />
                    </span>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${at ? "text-ink" : "text-faint"}`}>{at ? s.title : "???"}</p>
                      <p className="mt-0.5 text-[13px] leading-snug text-muted">{at ? s.found : s.classified ? CLASSIFIED_HINT : s.hint}</p>
                      {at && <p className="mt-1 font-mono text-[10px] text-faint">{new Date(at).toLocaleDateString()}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>

            {count < total && (
              <p className="mt-6 rounded-2xl border border-line bg-raised/40 p-4 text-sm leading-relaxed text-muted">
                Stuck on a secret you can't find? Reach out and I'll happily drop you a hint.{" "}
                <a href="#contact" onClick={onClose} className="whitespace-nowrap font-medium text-amber underline-offset-2 hover:underline">
                  Get in touch →
                </a>
              </p>
            )}

            {count > 0 && (
              <div className="mt-6 text-right">
                {confirmReset ? (
                  <span className="text-xs text-muted">
                    Forget all found secrets and Night Shift endings?{" "}
                    <button className="text-amber underline" onClick={() => resetSecrets()}>
                      Yes, reset
                    </button>{" "}
                    ·{" "}
                    <button className="underline" onClick={() => setConfirmReset(false)}>
                      No
                    </button>
                  </span>
                ) : (
                  <button className="text-xs text-faint underline-offset-2 hover:text-muted hover:underline" onClick={() => setConfirmReset(true)}>
                    Reset progress
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
