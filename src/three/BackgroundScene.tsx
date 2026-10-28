import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import DataDust from "./DataDust";
import CloudGlobe from "./CloudGlobe";
import { useGameOpen } from "./gameOverlay";

function RedrawOnScroll() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    // invalidate() only asks for the next frame, so this is already throttled to one render per frame.
    const f = () => invalidate();
    window.addEventListener("scroll", f, { passive: true });
    window.addEventListener("resize", f);
    return () => {
      window.removeEventListener("scroll", f);
      window.removeEventListener("resize", f);
    };
  }, [invalidate]);
  return null;
}

/** Desktop only: one fixed, full-screen WebGL layer behind the page — particles + the hero globe. */
export default function BackgroundScene({ reduce }: { reduce: boolean }) {
  const paused = useGameOpen();
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        frameloop={paused ? "never" : reduce ? "demand" : "always"}
      >
        {reduce && <RedrawOnScroll />}
        <DataDust count={1500} reduce={reduce} />
        <CloudGlobe dots={2600} reduce={reduce} />
      </Canvas>
    </div>
  );
}
