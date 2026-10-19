import { useEffect } from "react";
import { unlock, isFound } from "./store";

/*
 * Speedrunner: scroll from the top of the page to the very bottom quickly.
 * Only real scrolling counts — runs that use in-page links, the End/Home keys
 * or a scripted scroll (see `taintSpeedrun`) are ignored.
 */

const TOP = 120; // px from the top where a run starts
const PX_PER_SECOND = 2500; // required average speed; the limit scales with page length

let tainted = false;

/** Call before any programmatic scroll so it can't be mistaken for a speedrun. */
export function taintSpeedrun() {
  tainted = true;
}

export function useSpeedrun() {
  useEffect(() => {
    if (isFound("speedrunner")) return;
    let armed = window.scrollY < TOP;
    let start = 0;

    const onScroll = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (y < TOP) {
        armed = true;
        start = 0;
        tainted = false;
        return;
      }
      if (armed && !start) start = performance.now();
      if (!start || y < max - 4) return;

      const seconds = (performance.now() - start) / 1000;
      const limit = Math.max(3, max / PX_PER_SECOND);
      if (!tainted && seconds <= limit) {
        unlock("speedrunner", `You scrolled ${Math.round(max).toLocaleString("en-US")} px in ${seconds.toFixed(1)} s.`);
        window.removeEventListener("scroll", onScroll);
      }
      armed = false;
      start = 0;
    };

    // Jump-style navigation doesn't count.
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement | null)?.closest('a[href^="#"]')) tainted = true;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "End" || e.key === "Home" || ((e.metaKey || e.ctrlKey) && (e.key === "ArrowDown" || e.key === "ArrowUp"))) tainted = true;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKey);
    };
  }, []);
}
