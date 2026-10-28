import { useEffect } from "react";
import { unlock, isFound } from "./store";

/*
 * Speedrunner: scroll from the top of the page to the very bottom quickly.
 * Only real scrolling counts — a run during which an in-page link, the End/Home keys
 * or a scripted scroll (see `taintSpeedrun`) moved the page is ignored.
 *
 * The listener stays on for the whole visit, so the secret can be earned again right
 * after "Reset progress" without reloading the page.
 */

const TOP = 120; // px from the top where a run starts
const PX_PER_SECOND = 2500; // required average speed; the limit scales with page length
const JUMP_GRACE = 400; // ms — a jump this close to a run's start is what started it

let lastJump = -Infinity;

/** Call before any programmatic scroll so it can't be mistaken for a speedrun. */
export function taintSpeedrun() {
  lastJump = performance.now();
}

export function useSpeedrun() {
  useEffect(() => {
    let armed = window.scrollY < TOP;
    let start = 0;

    const onScroll = () => {
      if (isFound("speedrunner")) return;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (y < TOP) {
        armed = true;
        start = 0;
        return;
      }
      if (!armed) return;
      if (!start) start = performance.now();
      if (y < max - 4) return;

      const seconds = (performance.now() - start) / 1000;
      const limit = Math.max(3, max / PX_PER_SECOND);
      // A jump before the run began (e.g. tapping the name at the top) doesn't spoil it; one during it does.
      const jumped = lastJump > start - JUMP_GRACE;
      if (!jumped && seconds <= limit) unlock("speedrunner", `You scrolled ${Math.round(max).toLocaleString("en-US")} px in ${seconds.toFixed(1)} s.`);
      armed = false; // back to the top for another try
      start = 0;
    };

    // Jump-style navigation doesn't count.
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement | null)?.closest('a[href^="#"]')) taintSpeedrun();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "End" || e.key === "Home" || ((e.metaKey || e.ctrlKey) && (e.key === "ArrowDown" || e.key === "ArrowUp"))) taintSpeedrun();
    };

    // Measured once per frame, not on every scroll event.
    let queued = false;
    const onScrollEvent = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        onScroll();
      });
    };
    window.addEventListener("scroll", onScrollEvent, { passive: true });
    document.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScrollEvent);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKey);
    };
  }, []);
}
