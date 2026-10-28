// Pointer and scroll state shared with WebGL scenes without React re-renders.
export const input = { px: 0, py: 0, scrollY: 0 };

if (typeof window !== "undefined") {
  window.addEventListener(
    "pointermove",
    (e) => {
      input.px = (e.clientX / window.innerWidth) * 2 - 1;
      input.py = -((e.clientY / window.innerHeight) * 2 - 1);
    },
    { passive: true }
  );
  // Read once per frame at most (scroll events can fire many times per frame).
  let queued = false;
  const read = () => {
    queued = false;
    input.scrollY = window.scrollY;
  };
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(read);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  read();
}

export function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Phones and tablets: touch-first or narrow screens get the lightweight 3D mode. */
export function isLiteDevice() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
}
