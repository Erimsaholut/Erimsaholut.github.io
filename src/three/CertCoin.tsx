import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/* A spinning metallic badge. The face artwork is drawn on a canvas at runtime. */

function arcText(ctx: CanvasRenderingContext2D, text: string, r: number, top: boolean, step: number) {
  const chars = [...text];
  const total = step * (chars.length - 1);
  chars.forEach((ch, i) => {
    const a = top ? -Math.PI / 2 - total / 2 + i * step : Math.PI / 2 + total / 2 - i * step;
    ctx.save();
    ctx.translate(512 + r * Math.cos(a), 512 + r * Math.sin(a));
    ctx.rotate(top ? a + Math.PI / 2 : a - Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
}

function drawFace() {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(512, 430, 40, 512, 512, 512);
  g.addColorStop(0, "#2A2F24");
  g.addColorStop(1, "#0F110E");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 1024);

  ctx.strokeStyle = "#FFB547";
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.arc(512, 512, 488, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(512, 512, 380, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#FFB547";
  for (let i = 0; i < 2; i++) {
    const a = i === 0 ? Math.PI : 0;
    ctx.beginPath();
    ctx.arc(512 + 432 * Math.cos(a), 512 + 432 * Math.sin(a), 9, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ECE8DF";
  ctx.font = '600 50px "Bricolage Grotesque Variable", sans-serif';
  arcText(ctx, "CERTIFIED", 432, true, 0.11);
  arcText(ctx, "CLOUD PRACTITIONER", 432, false, 0.085);

  // Cloud glyph.
  ctx.fillStyle = "#FFB547";
  ctx.beginPath();
  ctx.arc(452, 380, 62, 0, Math.PI * 2);
  ctx.arc(540, 350, 82, 0, Math.PI * 2);
  ctx.arc(620, 392, 54, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(452, 392, 168, 54);
  ctx.beginPath();
  ctx.arc(452, 392, 54, Math.PI / 2, Math.PI * 1.5);
  ctx.fill();

  ctx.fillStyle = "#FFB547";
  ctx.font = '500 128px "JetBrains Mono", monospace';
  ctx.fillText("CLF-C02", 512, 560);
  ctx.fillStyle = "#A2A499";
  ctx.font = '500 40px "JetBrains Mono", monospace';
  ctx.fillText("FOUNDATIONAL", 512, 668);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function Environment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const rt = pm.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = rt.texture;
    return () => {
      scene.environment = null;
      rt.dispose();
      pm.dispose();
    };
  }, [gl, scene]);
  return null;
}

function Coin({ face, reduce }: { face: THREE.Texture; reduce: boolean }) {
  const outer = useRef<THREE.Group>(null!);
  const spinner = useRef<THREE.Group>(null!);
  const hover = useRef(false);
  const speed = useRef(0.7);

  const [metal, faceMat] = useMemo(() => {
    const metal = new THREE.MeshStandardMaterial({ color: "#FFB547", metalness: 1, roughness: 0.28 });
    const faceMat = new THREE.MeshStandardMaterial({
      map: face,
      metalness: 0.5,
      roughness: 0.42,
      emissive: "#ffffff",
      emissiveMap: face,
      emissiveIntensity: 0.32,
    });
    return [metal, faceMat];
  }, [face]);

  useFrame((state, dt) => {
    if (reduce) {
      spinner.current.rotation.y = -0.45;
      return;
    }
    const t = state.clock.elapsedTime;
    speed.current += ((hover.current ? 3.2 : 0.7) - speed.current) * Math.min(1, dt * 3);
    spinner.current.rotation.y += dt * speed.current;
    outer.current.position.y = Math.sin(t * 1.3) * 0.07;
    outer.current.rotation.x = Math.sin(t * 0.7) * 0.12;
  });

  return (
    <group
      ref={outer}
      onPointerOver={() => {
        hover.current = true;
        document.body.style.cursor = "grab";
      }}
      onPointerOut={() => {
        hover.current = false;
        document.body.style.cursor = "";
      }}
    >
      <group ref={spinner}>
        {/* Edge: open cylinder. Faces: separate discs so the artwork stays upright on both sides. */}
        <group rotation={[Math.PI / 2, 0, 0]}>
          <mesh material={metal}>
            <cylinderGeometry args={[1, 1, 0.14, 96, 1, true]} />
          </mesh>
        </group>
        <mesh position={[0, 0, 0.0702]} material={faceMat}>
          <circleGeometry args={[0.995, 96]} />
        </mesh>
        <mesh position={[0, 0, -0.0702]} rotation={[0, Math.PI, 0]} material={faceMat}>
          <circleGeometry args={[0.995, 96]} />
        </mesh>
        {[0.07, -0.07].map((z) => (
          <mesh key={z} position={[0, 0, z]} material={metal}>
            <torusGeometry args={[0.985, 0.035, 16, 120]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export default function CertCoin({ reduce }: { reduce: boolean }) {
  const [face, setFace] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      document.fonts.load('600 50px "Bricolage Grotesque Variable"'),
      document.fonts.load('500 128px "JetBrains Mono"'),
    ])
      .catch(() => undefined)
      .then(() => alive && setFace(drawFace()));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 3.6], fov: 38 }} gl={{ antialias: true, alpha: true }} frameloop={reduce ? "demand" : "always"}>
      <Environment />
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} />
      <pointLight position={[-3, -2, 3]} intensity={10} color="#FFB547" />
      {face && <Coin face={face} reduce={reduce} />}
    </Canvas>
  );
}
