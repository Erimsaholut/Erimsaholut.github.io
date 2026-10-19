import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Section, { Reveal } from "./Section";
import { ArrowUpRight, Check, Code, Copy, Download, Mail, Person, Pin } from "./Icons";
import { CV_FILE, PROFILE, cvUrl } from "../data";
import { isFound, unlock } from "../secrets/store";

export default function Contact() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PROFILE.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${PROFILE.email}`;
    }
  };

  // Invisible ink: a line written in the background colour. Selecting any part of it reveals it.
  const ink = useRef<HTMLParagraphElement>(null);
  const hold = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    const onSelect = () => {
      const sel = document.getSelection();
      if (!sel || sel.isCollapsed || !ink.current || isFound("invisible-ink")) return;
      for (let i = 0; i < sel.rangeCount; i++) {
        const r = sel.getRangeAt(i);
        const x = document.createRange();
        x.selectNodeContents(ink.current);
        if (r.compareBoundaryPoints(Range.START_TO_START, x) > 0) x.setStart(r.startContainer, r.startOffset);
        if (r.compareBoundaryPoints(Range.END_TO_END, x) < 0) x.setEnd(r.endContainer, r.endOffset);
        // Any real character counts (a long-press on a phone often selects a short word like "the").
        if (x.toString().trim().length > 0) {
          unlock("invisible-ink");
          return;
        }
      }
    };
    document.addEventListener("selectionchange", onSelect);
    return () => {
      document.removeEventListener("selectionchange", onSelect);
      clearTimeout(hold.current);
    };
  }, []);

  // Phones: selecting invisible text with a finger is fiddly, so pressing and holding anywhere on the
  // (padded) line highlights the whole sentence — which then counts as a selection above.
  const selectInk = () => {
    const el = ink.current;
    const sel = document.getSelection();
    if (!el || !sel) return;
    const r = document.createRange();
    r.selectNodeContents(el);
    sel.removeAllRanges();
    sel.addRange(r);
  };
  const startHold = (e: ReactPointerEvent) => {
    if (e.pointerType === "mouse") return;
    clearTimeout(hold.current);
    hold.current = setTimeout(selectInk, 420);
  };
  const stopHold = () => clearTimeout(hold.current);

  const links = [
    { label: "GitHub", sub: PROFILE.github.label, href: PROFILE.github.url, icon: Code },
    { label: "LinkedIn", sub: PROFILE.linkedin.label, href: PROFILE.linkedin.url, icon: Person },
  ];

  return (
    <Section id="contact" index="06" label="Contact" title={<>Let's talk. <span className="text-muted">I'm looking for an internship.</span></>}>
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-7 md:p-12">
          <div className="graph-paper pointer-events-none absolute inset-0 opacity-70" aria-hidden />
          <div className="relative grid gap-10 md:grid-cols-12 md:items-end">
            <div className="md:col-span-7">
              <p className="max-w-md text-lg text-muted">
                Have a role, a project or a question? Send me an email.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href={`mailto:${PROFILE.email}`}
                  className="inline-flex items-center gap-3 rounded-md bg-amber px-5 py-3.5 font-medium text-bg transition hover:bg-amber/90"
                >
                  <Mail className="w-5 h-5" />
                  <span className="break-all">{PROFILE.email}</span>
                </a>
                <button
                  onClick={copy}
                  className="inline-flex items-center gap-2 rounded-md border border-line bg-bg/60 px-4 py-3.5 text-sm text-ink transition hover:border-ink/30"
                  aria-live="polite"
                >
                  {copied ? <Check className="w-4 h-4 text-sage" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <a
                  href={cvUrl()}
                  download={CV_FILE}
                  className="inline-flex items-center gap-2 rounded-md border border-line bg-bg/60 px-4 py-3.5 text-sm text-ink transition hover:border-ink/30"
                >
                  <Download className="w-4 h-4" /> CV (PDF)
                </a>
              </div>
              <p className="mt-6 inline-flex items-center gap-2 text-sm text-faint">
                <Pin className="w-4 h-4" /> {PROFILE.location}
              </p>
            </div>

            <ul className="space-y-3 md:col-span-5">
              {links.map(({ label, sub, href, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-4 rounded-xl border border-line bg-bg/60 px-5 py-4 transition-colors hover:border-amber/50"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-raised text-amber">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-medium">{label}</span>
                      <span className="block text-sm text-muted">{sub}</span>
                    </span>
                    <ArrowUpRight className="w-5 h-5 text-faint transition group-hover:text-amber group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
      <p
        ref={ink}
        aria-hidden
        onPointerDown={startHold}
        onPointerUp={stopHold}
        onPointerCancel={stopHold}
        onPointerLeave={stopHold}
        onContextMenu={selectInk}
        className="mt-2 py-4 text-right font-mono text-xs tracking-wide text-transparent"
      >
        psst — the little light in the footer speaks Morse. Decode it, then tell the terminal.
      </p>
    </Section>
  );
}
