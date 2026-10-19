import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { SECRETS } from "./registry";
import { useSecrets } from "./store";
import { CERT_H, CERT_W, drawCertificate, duration, type CertInfo } from "./certificate";
import { PROFILE } from "../data";

/* The prize for finding every secret: a personal certificate to download (and share). */

const NAME_KEY = "eo-reward-name";

function savedName() {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export default function Reward({ onClose }: { onClose: () => void }) {
  const { found } = useSecrets();
  const [name, setName] = useState(savedName);
  const [saving, setSaving] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const info: CertInfo = useMemo(() => {
    const times = SECRETS.map((s) => found[s.id]).filter(Boolean);
    const now = Date.now();
    return { name, total: SECRETS.length, first: times.length ? Math.min(...times) : now, last: times.length ? Math.max(...times) : now };
  }, [found, name]);

  useEffect(() => {
    const t = setTimeout(() => canvas.current && void drawCertificate(canvas.current, info), 120);
    try {
      localStorage.setItem(NAME_KEY, name);
    } catch {
      /* fine */
    }
    return () => clearTimeout(t);
  }, [info, name]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const download = async () => {
    const c = canvas.current;
    if (!c) return;
    setSaving(true);
    await drawCertificate(c, info);
    c.toBlob((blob) => {
      setSaving(false);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "certified-secret-hunter.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }, "image/png");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[115] flex items-end justify-center bg-bg/75 backdrop-blur-sm sm:items-center sm:p-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Your reward"
    >
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92svh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-amber/30 bg-surface p-5 shadow-[0_40px_120px_-30px_rgba(255,181,71,0.35)] sm:rounded-3xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Reward unlocked</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">You found all {SECRETS.length} secrets 🏆</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              It took you {duration(info.last - info.first)}. Here's your reward: an official (and totally unofficial) certificate. Add your name and download it.
            </p>
          </div>
          <button ref={closeRef} onClick={onClose} aria-label="Close" className="shrink-0 rounded-lg border border-line p-2 text-muted transition hover:text-ink">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <canvas
          ref={canvas}
          width={CERT_W}
          height={CERT_H}
          className="mt-6 block h-auto w-full rounded-xl border border-line bg-bg"
          aria-label={`Certificate: ${name.trim() || "A Curious Visitor"}, Certified Secret Hunter`}
        />

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">Name on the certificate</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 40))}
              placeholder="Your name on the certificate"
              autoComplete="name"
              className="w-full rounded-md border border-line bg-bg px-4 py-3 text-sm text-ink outline-none transition placeholder:text-faint focus:border-amber/60"
            />
          </label>
          <button
            onClick={download}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-amber px-5 py-3 text-sm font-semibold text-bg transition hover:bg-amber/90 disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 20h14" />
            </svg>
            {saving ? "Preparing…" : "Download PNG"}
          </button>
        </div>

        <p className="mt-5 text-sm text-muted">
          Made it this far? I'd love to hear how —{" "}
          <a className="text-amber underline underline-offset-2 hover:text-ink" href={`mailto:${PROFILE.email}?subject=${encodeURIComponent("Secret Hunter")}`}>
            email me
          </a>{" "}
          with the subject “Secret Hunter”.
        </p>
      </motion.div>
    </motion.div>
  );
}
