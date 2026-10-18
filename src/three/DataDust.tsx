import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { input } from "./input";

const PALETTE = [
  ["#ECE8DF", 0.55],
  ["#FFB547", 0.2],
  ["#93D3A2", 0.13],
  ["#8FB0EC", 0.12],
] as const;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aScale;
  attribute float aSeed;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.16 + aSeed * 6.2831) * 0.35;
    p.y += cos(uTime * 0.13 + aSeed * 4.1) * 0.35;
    p.z += sin(uTime * 0.11 + aSeed * 2.7) * 0.25;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = 70.0 * aScale * uPixelRatio / -mv.z;
    vColor = aColor;
    vAlpha = 0.25 + 0.75 * (0.5 + 0.5 * sin(uTime * 1.3 + aSeed * 40.0));
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, a * a * vAlpha * 0.9);
  }
`;

/** Drifting, twinkling particles that fill the page and parallax with scroll and pointer. */
export default function DataDust({ count, reduce }: { count: number; reduce: boolean }) {
  const ref = useRef<THREE.Points>(null!);

  const [geometry, material] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const scale = new Float32Array(count);
    const seed = new Float32Array(count);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 28;
      pos[i * 3 + 1] = Math.random() * 32 - 26;
      pos[i * 3 + 2] = Math.random() * 13 - 10;
      let r = Math.random();
      let pick: string = PALETTE[0][0];
      for (const [hex, w] of PALETTE) {
        if ((r -= w) <= 0) {
          pick = hex;
          break;
        }
      }
      c.set(pick).multiplyScalar(0.85);
      col.set([c.r, c.g, c.b], i * 3);
      scale[i] = 0.35 + Math.random() ** 2 * 1.2;
      seed[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aScale", new THREE.BufferAttribute(scale, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const m = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 } },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return [g, m];
  }, [count]);

  useFrame((state) => {
    material.uniforms.uTime.value = reduce ? 0 : state.clock.elapsedTime;
    material.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    const p = ref.current;
    // Moves up a little slower than the page → depth parallax.
    p.position.y = (input.scrollY / state.size.height) * state.viewport.height * 0.35;
    p.rotation.y += (input.px * 0.06 - p.rotation.y) * 0.03;
    p.rotation.x += (-input.py * 0.04 - p.rotation.x) * 0.03;
  });

  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />;
}
