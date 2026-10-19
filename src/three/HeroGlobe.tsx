import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import CloudGlobe from "./CloudGlobe";
import { useOnScreen } from "./useOnScreen";
import { useGameOpen } from "./gameOverlay";

/** Phones/tablets: the globe in its own small canvas, rendered only while it's on screen. */
export default function HeroGlobe({ reduce }: { reduce: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useOnScreen(ref, "0px");
  const gameOpen = useGameOpen();
  const onScreen = visible && !gameOpen;
  return (
    <div ref={ref} className="absolute inset-0">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        frameloop={reduce ? "demand" : onScreen ? "always" : "never"}
        style={{ pointerEvents: "none" }}
      >
        <CloudGlobe dots={1200} reduce={reduce} fill />
      </Canvas>
    </div>
  );
}
