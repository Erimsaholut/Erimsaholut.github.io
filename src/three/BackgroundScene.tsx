import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import DataDust from "./DataDust";
import CloudGlobe from "./CloudGlobe";

function RedrawOnScroll() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
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

/** One fixed, full-screen WebGL layer behind the page: particles + the hero globe. */
export default function BackgroundScene({ reduce }: { reduce: boolean }) {
  const mobile = window.innerWidth < 768;
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <Canvas
        dpr={[1, mobile ? 1.5 : 1.75]}
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        frameloop={reduce ? "demand" : "always"}
      >
        {reduce && <RedrawOnScroll />}
        <DataDust count={mobile ? 650 : 1500} reduce={reduce} />
        <CloudGlobe dots={mobile ? 1400 : 2600} reduce={reduce} />
      </Canvas>
    </div>
  );
}
