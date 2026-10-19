import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ABILITIES, CREDIT_RULES, Game, MAX_DOWN, type Ability, type HudState } from "./engine";
import { gameOverlay } from "../three/gameOverlay";
import { hasWebGL } from "../three/input";
import { unlock } from "../secrets/store";

const EASE = [0.22, 1, 0.36, 1] as const;
const ORDER: Ability[] = ["shield", "scale", "pulse"];

function Icon({ name, className = "h-5 w-5" }: { name: Ability | "close" | "pause" | "play" | "sound" | "mute" | "info"; className?: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {name === "shield" && <path {...p} d="M12 3.5 5 6.5v5.2c0 4.1 2.9 7.6 7 8.8 4.1-1.2 7-4.7 7-8.8V6.5l-7-3Z M9 12l2.2 2.2L15.5 10" />}
      {name === "scale" && (
        <g {...p}>
          <rect x="4" y="13" width="4" height="7" rx="1" />
          <rect x="10" y="9" width="4" height="11" rx="1" />
          <rect x="16" y="5" width="4" height="15" rx="1" />
        </g>
      )}
      {name === "pulse" && (
        <g {...p}>
          <circle cx="12" cy="12" r="2.2" />
          <circle cx="12" cy="12" r="5.6" opacity="0.7" />
          <circle cx="12" cy="12" r="9" opacity="0.4" />
        </g>
      )}
      {name === "close" && <path {...p} d="M6 6l12 12M18 6 6 18" />}
      {name === "info" && (
        <g {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5.5M12 7.6v.1" />
        </g>
      )}
      {name === "pause" && <path {...p} d="M9 6v12M15 6v12" />}
      {name === "play" && <path {...p} d="M8 5.5v13l10.5-6.5L8 5.5Z" />}
      {name === "sound" && <path {...p} d="M4 9.5h3.5L12 6v12l-4.5-3.5H4v-5ZM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />}
      {name === "mute" && <path {...p} d="M4 9.5h3.5L12 6v12l-4.5-3.5H4v-5ZM16 9.5l5 5M21 9.5l-5 5" />}
    </svg>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface/80 text-ink backdrop-blur transition hover:border-ink/30"
    >
      {children}
    </button>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-[#07080A]/55 p-5 backdrop-blur-[2px]"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="max-h-[calc(100svh-32px)] w-full max-w-md overflow-y-auto rounded-3xl border border-line bg-surface/90 p-6 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-7 md:p-9"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/** What each power-up does, its cost and how to use it — shown on the start screen and behind the ⓘ button. */
function PowerUpGuide() {
  return (
    <div>
      <ul className="space-y-3">
        {ORDER.map((a) => {
          const info = ABILITIES[a];
          return (
            <li key={a} className="flex gap-3 rounded-2xl border border-line bg-raised/70 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-bg/60 text-amber">
                <Icon name={a} />
              </span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-semibold text-ink">
                  {info.name}
                  <span className="rounded bg-amber/15 px-1.5 py-0.5 font-mono text-[10px] font-medium text-amber">{info.cost} credits</span>
                  <span className="hidden font-mono text-[10px] font-normal text-faint [@media(pointer:fine)]:inline">key {info.key}</span>
                </p>
                <p className="mt-1 text-[13px] leading-snug text-ink/85">{info.desc}</p>
                <p className="mt-1 text-xs text-muted">{info.how}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted">{CREDIT_RULES}</p>
    </div>
  );
}

export default function RegionDefender({ onClose, lite }: { onClose: () => void; lite: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const game = useRef<Game | null>(null);
  const [hud, setHud] = useState<HudState | null>(null);
  const hudRef = useRef<HudState | null>(null);
  hudRef.current = hud;
  const [failed, setFailed] = useState(false);
  const [bannerOn, setBannerOn] = useState<{ text: string; id: number } | null>(null);
  const [help, setHelp] = useState(false);
  const helpRef = useRef({ open: false, resumeAfter: false });
  const webgl = useMemo(() => hasWebGL(), []);
  const reduce = !!useReducedMotion();

  // Mount the engine on a fresh canvas (also keeps React StrictMode remounts clean).
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    gameOverlay.set(true);
    root.current?.focus();

    let canvas: HTMLCanvasElement | null = null;
    if (webgl && host.current) {
      canvas = document.createElement("canvas");
      canvas.className = "absolute inset-0 h-full w-full touch-none";
      host.current.appendChild(canvas);
      try {
        game.current = new Game(canvas, setHud, { lite, reduceMotion: reduce });
      } catch {
        setFailed(true);
      }
    } else setFailed(true);

    return () => {
      game.current?.dispose();
      game.current = null;
      canvas?.remove();
      gameOverlay.set(false);
      html.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (helpRef.current.open) {
        if (e.key === "Escape" || e.key.toLowerCase() === "i") closeHelp();
        return;
      }
      if (e.key.toLowerCase() === "i") {
        openHelp();
        return;
      }
      if (e.key === "Escape") {
        if (!game.current?.cancelTargeting()) onClose();
        return;
      }
      if (game.current?.key(e.key)) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Show each banner for a moment.
  const wave = hud?.wave ?? 0;
  useEffect(() => {
    if (wave >= 5) unlock("wave-5");
  }, [wave]);

  const bannerId = hud?.banner?.id;
  useEffect(() => {
    if (!hud?.banner) return;
    setBannerOn(hud.banner);
    const t = setTimeout(() => setBannerOn(null), 2300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bannerId]);

  const g = () => game.current;

  // The ⓘ guide pauses a running game and resumes it when closed.
  function openHelp() {
    const resumeAfter = game.current ? hudRef.current?.phase === "playing" : false;
    if (resumeAfter) game.current?.pause();
    helpRef.current = { open: true, resumeAfter };
    setHelp(true);
  }
  function closeHelp() {
    if (helpRef.current.resumeAfter) game.current?.resume();
    helpRef.current = { open: false, resumeAfter: false };
    setHelp(false);
  }
  const playing = hud?.phase === "playing";
  const down = hud ? hud.total - hud.online : 0;

  return (
    <motion.div
      ref={root}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Region Defender — mini game"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] select-none overflow-hidden bg-[#07080A] font-sans text-ink outline-none"
    >
      <div ref={host} className="absolute inset-0" />

      {failed && (
        <Card>
          <p className="eyebrow">Region Defender</p>
          <h2 className="mt-3 font-display text-3xl font-semibold">WebGL isn't available</h2>
          <p className="mt-3 text-muted">This browser can't run the 3D game. Try a recent version of Chrome, Safari, Firefox or Edge.</p>
          <button onClick={onClose} className="mt-8 rounded-md bg-amber px-5 py-3 text-sm font-semibold text-bg">
            Back to the site
          </button>
        </Card>
      )}

      {hud && (
        <div className="pointer-events-none absolute inset-0">
          {/* Top bar */}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 pt-[max(12px,env(safe-area-inset-top))] sm:p-5">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber">Region Defender</p>
              <p className="font-display text-3xl font-semibold leading-none tabular-nums sm:text-4xl">{hud.score.toLocaleString()}</p>
              <p className="mt-1.5 font-mono text-[11px] text-muted">
                Wave {Math.max(1, hud.wave)} · {hud.blocked} blocked
              </p>
              <AnimatePresence>
                {hud.combo > 1 && (
                  <motion.span
                    key={hud.combo}
                    initial={{ scale: 1.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-2 inline-block rounded-md bg-amber/15 px-2 py-0.5 font-mono text-xs font-medium text-amber"
                  >
                    combo ×{hud.combo}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-2">
                <IconButton label={hud.muted ? "Unmute" : "Mute"} onClick={() => g()?.toggleMute()}>
                  <Icon name={hud.muted ? "mute" : "sound"} />
                </IconButton>
                {(hud.phase === "playing" || hud.phase === "paused") && (
                  <IconButton label={playing ? "Pause" : "Resume"} onClick={() => g()?.togglePause()}>
                    <Icon name={playing ? "pause" : "play"} />
                  </IconButton>
                )}
                <IconButton label="Close game" onClick={onClose}>
                  <Icon name="close" />
                </IconButton>
              </div>
              <div className="rounded-xl border border-line bg-surface/70 px-3 py-2 backdrop-blur">
                <p className="text-right font-mono text-[10px] uppercase tracking-wider text-muted">
                  <span className={down >= MAX_DOWN - 1 ? "text-[#FF5A4F]" : "text-ink"}>{hud.online}</span>/{hud.total} regions online
                </p>
                <div className="mt-1.5 flex justify-end gap-1">
                  {hud.hubs.map((h) => (
                    <span
                      key={h.name}
                      title={h.name}
                      className={`h-1.5 w-2.5 rounded-full sm:w-3 ${
                        !h.online ? "bg-line" : h.hp > 60 ? "bg-sage" : h.hp > 30 ? "bg-amber" : "bg-[#FF5A4F]"
                      } ${h.danger ? "animate-pulse" : ""} ${h.shield ? "ring-1 ring-[#7FE7FF]" : ""}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Region list (large screens) */}
          {hud.phase !== "intro" && (
            <div className="absolute bottom-6 left-6 hidden w-56 rounded-2xl border border-line bg-surface/70 p-4 backdrop-blur lg:block">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-faint">Regions</p>
              <ul className="space-y-1.5">
                {hud.hubs.map((h) => (
                  <li key={h.name} className="flex items-center gap-2 text-xs">
                    <span className={`w-24 truncate ${h.online ? "text-ink/90" : "text-faint line-through"}`}>{h.name}</span>
                    <span className="h-1 flex-1 overflow-hidden rounded-full bg-line">
                      <span
                        className={`block h-full rounded-full transition-[width] duration-300 ${h.hp > 60 ? "bg-sage" : h.hp > 30 ? "bg-amber" : "bg-[#FF5A4F]"}`}
                        style={{ width: `${h.online ? h.hp : 0}%` }}
                      />
                    </span>
                    {h.shield > 0 && <span className="font-mono text-[10px] text-[#7FE7FF]">{h.shield}</span>}
                    {h.danger && <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[#FF5A4F]" />}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Banner */}
          <div className="absolute inset-x-0 top-[22%] flex justify-center px-4">
            <AnimatePresence mode="wait">
              {bannerOn && (
                <motion.p
                  key={bannerOn.id}
                  initial={{ opacity: 0, y: 12, letterSpacing: "0.3em" }}
                  animate={{ opacity: 1, y: 0, letterSpacing: "0.12em" }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="rounded-full border border-amber/30 bg-bg/70 px-4 py-2 text-center font-mono text-xs uppercase text-amber backdrop-blur sm:text-sm"
                >
                  {bannerOn.text}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Tap ripple */}
          {hud.tap && (
            <span
              key={hud.tap.id}
              className={`absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 animate-ripple ${hud.tap.hit ? "border-amber" : "border-ink/30"}`}
              style={{ left: hud.tap.x, top: hud.tap.y }}
            />
          )}

          {/* Abilities */}
          {(hud.phase === "playing" || hud.phase === "paused") && (
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 p-3 pb-[max(14px,env(safe-area-inset-bottom))] sm:p-6">
              <AnimatePresence>
                {hud.targeting && (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="pointer-events-auto rounded-full border border-[#7FE7FF]/40 bg-bg/80 px-4 py-1.5 text-xs text-[#7FE7FF] backdrop-blur"
                  >
                    Tap a region to deploy {ABILITIES[hud.targeting].name} ·{" "}
                    <button className="underline" onClick={() => g()?.cancelTargeting()}>
                      cancel
                    </button>
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="pointer-events-auto flex items-stretch gap-1.5 rounded-2xl border border-line bg-surface/80 p-1.5 backdrop-blur-xl sm:gap-2 sm:p-2">
                <motion.div
                  key={hud.denied}
                  animate={hud.denied ? { x: [0, -6, 6, -4, 4, 0] } : undefined}
                  transition={{ duration: 0.35 }}
                  className="flex min-w-[52px] flex-col items-center justify-center px-1.5 sm:min-w-[64px] sm:px-2"
                >
                  <span className="font-display text-2xl font-semibold leading-none text-amber tabular-nums">{hud.credits}</span>
                  <span className="mt-1 font-mono text-[9px] uppercase tracking-wider text-faint">credits</span>
                </motion.div>
                {ORDER.map((a) => {
                  const info = ABILITIES[a];
                  const cd = a === "pulse" ? hud.pulseCd : 0;
                  const ready = hud.credits >= info.cost && cd === 0;
                  const active = hud.targeting === a;
                  return (
                    <button
                      key={a}
                      onClick={() => g()?.useAbility(a)}
                      title={info.desc}
                      className={`relative flex w-[78px] flex-col items-center gap-1 overflow-hidden rounded-xl border px-1.5 py-2 text-center transition sm:w-[104px] sm:px-2 ${
                        active
                          ? "border-[#7FE7FF] bg-[#7FE7FF]/10 text-[#7FE7FF]"
                          : ready
                            ? "border-line bg-raised text-ink hover:border-amber/50"
                            : "border-line bg-raised/50 text-faint"
                      }`}
                    >
                      {cd > 0 && <span className="absolute inset-x-0 bottom-0 bg-ink/10" style={{ height: `${cd * 100}%` }} />}
                      <Icon name={a} />
                      <span className="text-[11px] font-medium leading-tight sm:text-xs">{info.name}</span>
                      <span className="font-mono text-[10px] text-amber/90">
                        {info.cost}
                        <span className="ml-1 hidden text-faint [@media(pointer:fine)]:inline">[{info.key}]</span>
                      </span>
                    </button>
                  );
                })}
                <button
                  onClick={openHelp}
                  aria-label="What do the power-ups do?"
                  title="What do the power-ups do?"
                  className="flex w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-raised text-muted transition hover:border-amber/50 hover:text-amber sm:w-10"
                >
                  <Icon name="info" />
                </button>
              </div>
            </div>
          )}

          <AnimatePresence>
            {hud.phase === "intro" && (
              <Card key="intro">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-sage">Easter egg unlocked</p>
                <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
                  Region <span className="text-amber">Defender</span>
                </h2>
                <p className="mt-3 text-muted">DDoS traffic is hitting the global network. Keep the regions online as long as you can.</p>
                <ul className="mt-6 space-y-2.5 text-sm text-ink/90">
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#FF5A4F]" />
                    Tap or click incoming packets to block them. Purple ones (from wave 4) take 3 hits.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky" />
                    Drag to rotate the globe — attacks can come from the far side.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber" />
                    Earn credits and spend them on the power-ups below.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-line" />
                    Lose {MAX_DOWN} regions and the network goes down.
                  </li>
                </ul>
                <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">Power-ups</p>
                <div className="mt-3">
                  <PowerUpGuide />
                </div>
                {/* Pinned to the bottom of the card so Start is always reachable on small screens. */}
                <div className="sticky -bottom-6 mt-4 flex items-center justify-between gap-4 bg-gradient-to-t from-surface via-surface to-surface/0 pb-1 pt-6 sm:-bottom-7 md:-bottom-9">
                  <button
                    onClick={() => g()?.start()}
                    className="rounded-md bg-amber px-6 py-3 text-sm font-semibold text-bg shadow-[0_10px_40px_-10px_rgba(255,181,71,0.6)] transition hover:bg-amber/90"
                  >
                    Start defending
                  </button>
                  {hud.best > 0 && <span className="font-mono text-xs text-muted">Best: {hud.best.toLocaleString()}</span>}
                </div>
              </Card>
            )}

            {hud.phase === "paused" && !help && (
              <Card key="paused">
                <p className="eyebrow">Paused</p>
                <h2 className="mt-3 font-display text-3xl font-semibold">Traffic on hold</h2>
                <p className="mt-2 text-muted">Wave {hud.wave} · {hud.score.toLocaleString()} points</p>
                <div className="mt-8 flex gap-3">
                  <button onClick={() => g()?.resume()} className="rounded-md bg-amber px-5 py-3 text-sm font-semibold text-bg">
                    Resume
                  </button>
                  <button onClick={onClose} className="rounded-md border border-line px-5 py-3 text-sm">
                    Back to the site
                  </button>
                </div>
              </Card>
            )}

            {help && (
              <Card key="help">
                <p className="eyebrow">How power-ups work</p>
                <h2 className="mt-3 font-display text-3xl font-semibold">Power-ups</h2>
                <p className="mt-2 text-sm text-muted">The game is paused while you read.</p>
                <div className="mt-5">
                  <PowerUpGuide />
                </div>
                <button onClick={closeHelp} className="mt-7 rounded-md bg-amber px-5 py-3 text-sm font-semibold text-bg">
                  {helpRef.current.resumeAfter ? "Got it — resume" : "Got it"}
                </button>
              </Card>
            )}

            {hud.phase === "over" && (
              <Card key="over">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#FF5A4F]">Network down</p>
                <h2 className="mt-3 font-display text-4xl font-semibold tabular-nums">{hud.score.toLocaleString()}</h2>
                <p className="mt-1 text-sm text-muted">{hud.newBest ? "New best score!" : `Best: ${hud.best.toLocaleString()}`}</p>
                <dl className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-line bg-raised px-4 py-3">
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-faint">Waves survived</dt>
                    <dd className="mt-1 font-display text-2xl">{Math.max(0, hud.wave - 1)}</dd>
                  </div>
                  <div className="rounded-xl border border-line bg-raised px-4 py-3">
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-faint">Threats blocked</dt>
                    <dd className="mt-1 font-display text-2xl">{hud.blocked}</dd>
                  </div>
                </dl>
                <div className="mt-8 flex gap-3">
                  <button onClick={() => g()?.start()} className="rounded-md bg-amber px-5 py-3 text-sm font-semibold text-bg">
                    Play again
                  </button>
                  <button onClick={onClose} className="rounded-md border border-line px-5 py-3 text-sm">
                    Back to the site
                  </button>
                </div>
              </Card>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
