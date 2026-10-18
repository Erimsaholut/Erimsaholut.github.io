import { useEffect, useState, type RefObject } from "react";

/** True while the element is (nearly) in the viewport — used to pause WebGL rendering. */
export function useOnScreen(ref: RefObject<Element | null>, margin = "200px") {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);
  return on;
}
