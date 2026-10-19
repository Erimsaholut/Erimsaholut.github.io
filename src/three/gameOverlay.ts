import { useSyncExternalStore } from "react";

/* Tiny shared flag: while the game overlay is open, the site's own WebGL scenes stop rendering. */
let open = false;
const subs = new Set<() => void>();

export const gameOverlay = {
  set(v: boolean) {
    open = v;
    subs.forEach((f) => f());
  },
};

export function useGameOpen() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => {
        subs.delete(f);
      };
    },
    () => open,
    () => false
  );
}
