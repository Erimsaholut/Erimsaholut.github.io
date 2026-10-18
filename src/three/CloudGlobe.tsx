import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clamp, input } from "./input";

/*
 * A dotted globe with glowing data-center hubs, arcs between them and packets
 * travelling along the arcs. It positions itself over the DOM element marked
 * [data-globe-anchor], so it follows the page layout and scroll exactly.
 */

const R = 1.7;
const AMBER = "#FFB547";
const SAGE = "#93D3A2";
const SKY = "#8FB0EC";
const INK = "#ECE8DF";

// Approximate coordinates of major cloud data-center cities. Index 0 = Torino (home).
const HUBS = [
  [45.07, 7.69], // Torino
  [50.11, 8.68], // Frankfurt
  [53.35, -6.26], // Dublin
  [59.33, 18.07], // Stockholm
  [38.95, -77.45], // N. Virginia
  [45.84, -119.7], // Oregon
  [-23.55, -46.63], // São Paulo
  [19.08, 72.88], // Mumbai
  [1.35, 103.82], // Singapore
  [35.68, 139.69], // Tokyo
  [-33.87, 151.21], // Sydney
];

const ARCS: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 7], [0, 8], [0, 9], [0, 6],
  [4, 5], [4, 6], [2, 4], [8, 9], [8, 10], [7, 8], [1, 3], [5, 9],
];

function latLon(lat: number, lon: number, r = R) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const th = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
}

const dotsVert = /* glsl */ `
  uniform float uOpacity;
  uniform float uPixelRatio;
  uniform float uScale;
  varying float vAlpha;
  varying float vLand;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vec3 n = normalize(mat3(modelMatrix) * position);
    vec3 v = normalize(cameraPosition - wp.xyz);
    float facing = dot(n, v);
    vec3 p = normalize(position);
    float land = sin(p.x * 4.1 + 1.3) * sin(p.y * 3.3 + 0.7) * sin(p.z * 3.7 + 2.1) + 0.45 * sin(p.x * 9.0 + p.z * 7.0);
    vLand = smoothstep(-0.05, 0.45, land);
    vAlpha = (0.14 + 0.8 * vLand) * smoothstep(-0.2, 0.35, facing) * uOpacity;
    vec4 mv = viewMatrix * wp;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (2.2 + 2.0 * vLand) * uPixelRatio * uScale * (6.0 / -mv.z);
  }
`;
const dotsFrag = /* glsl */ `
  varying float vAlpha;
  varying float vLand;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.15, d);
    vec3 c = mix(vec3(0.93, 0.91, 0.87), vec3(0.58, 0.83, 0.64), vLand * 0.25);
    gl_FragColor = vec4(c, a * vAlpha);
  }
`;

const rimVert = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const rimFrag = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float f = pow(1.0 - max(dot(vN, vV), 0.0), 2.6);
    vec3 c = mix(vec3(0.56, 0.69, 0.93), vec3(1.0, 0.71, 0.28), smoothstep(0.2, 0.9, vN.y * 0.5 + 0.5));
    gl_FragColor = vec4(c, f * 0.75 * uOpacity);
  }
`;

const arcVert = /* glsl */ `
  attribute float aT;
  varying float vT;
  void main() {
    vT = aT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const arcFrag = /* glsl */ `
  uniform float uHead;
  uniform float uOpacity;
  uniform vec3 uColor;
  varying float vT;
  void main() {
    float d = uHead - vT;
    float trail = d > 0.0 ? exp(-d * 5.0) : 0.0;
    gl_FragColor = vec4(uColor * (0.8 + trail), (0.24 + trail * 1.2) * uOpacity);
  }
`;

const glowVert = /* glsl */ `
  uniform float uPixelRatio;
  uniform float uScale;
  attribute vec3 aColor;
  attribute float aSize;
  varying vec3 vColor;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * uScale * (8.0 / -mv.z);
    vColor = aColor;
  }
`;
const glowFrag = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = pow(smoothstep(0.5, 0.0, d), 2.0);
    gl_FragColor = vec4(vColor, a * uOpacity);
  }
`;

function glowMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 0 }, uPixelRatio: { value: 1 }, uScale: { value: 1 } },
    vertexShader: glowVert,
    fragmentShader: glowFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

export default function CloudGlobe({ dots, reduce, fill = false }: { dots: number; reduce: boolean; fill?: boolean }) {
  const root = useRef<THREE.Group>(null!);
  const tilt = useRef<THREE.Group>(null!);
  const spin = useRef<THREE.Group>(null!);
  const orbitA = useRef<THREE.Group>(null!);
  const orbitB = useRef<THREE.Group>(null!);
  const rings = useRef<THREE.Mesh[]>([]);
  const anchor = useRef<HTMLElement | null>(null);
  const opacity = useRef(0);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const scene = useMemo(() => {
    // Fibonacci-lattice dots.
    const pos = new Float32Array(dots * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < dots; i++) {
      const y = 1 - (i / (dots - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = i * golden;
      pos.set([Math.cos(th) * r * R, y * R, Math.sin(th) * r * R], i * 3);
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const dotMat = new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 0 }, uPixelRatio: { value: 1 }, uScale: { value: 1 } },
      vertexShader: dotsVert,
      fragmentShader: dotsFrag,
      transparent: true,
      depthWrite: false,
    });

    const occluderMat = new THREE.MeshBasicMaterial({ color: "#0F110E", transparent: true, opacity: 0 });
    const rimMat = new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 0 } },
      vertexShader: rimVert,
      fragmentShader: rimFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const hubs = HUBS.map(([la, lo]) => latLon(la, lo));
    const hubGeo = new THREE.BufferGeometry().setFromPoints(hubs.map((v) => v.clone().multiplyScalar(1.004)));
    hubGeo.setAttribute(
      "aColor",
      new THREE.BufferAttribute(new Float32Array(hubs.flatMap((_, i) => new THREE.Color(i === 0 ? AMBER : i % 2 ? SAGE : INK).toArray())), 3)
    );
    hubGeo.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(hubs.map((_, i) => (i === 0 ? 34 : 18))), 1));
    const hubMat = glowMaterial();

    const arcs = ARCS.map(([a, b], i) => {
      const s = hubs[a];
      const e = hubs[b];
      const lift = 1.08 + s.distanceTo(e) * 0.16;
      const mid = s.clone().add(e).normalize().multiplyScalar(R * lift);
      const curve = new THREE.QuadraticBezierCurve3(s, mid, e);
      const pts = curve.getPoints(90);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      geo.setAttribute("aT", new THREE.BufferAttribute(new Float32Array(pts.map((_, k) => k / (pts.length - 1))), 1));
      const color = new THREE.Color(a === 0 ? AMBER : i % 2 ? SKY : SAGE);
      const mat = new THREE.ShaderMaterial({
        uniforms: { uHead: { value: 0 }, uOpacity: { value: 0 }, uColor: { value: color } },
        vertexShader: arcVert,
        fragmentShader: arcFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      return { curve, mat, line: new THREE.Line(geo, mat), color, speed: 0.16 + (i % 5) * 0.035, offset: (i * 0.137) % 1 };
    });

    const packetGeo = new THREE.BufferGeometry();
    packetGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(arcs.length * 3), 3));
    packetGeo.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(arcs.flatMap((a) => a.color.toArray())), 3));
    packetGeo.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(arcs.map(() => 16)), 1));
    const packetMat = glowMaterial();

    const ringMats = hubs.map(
      (_, i) =>
        new THREE.MeshBasicMaterial({
          color: i === 0 ? AMBER : SAGE,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
    );
    const ringQuats = hubs.map((v) => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), v.clone().normalize()));
    const orbitMatA = new THREE.MeshBasicMaterial({ color: SKY, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const orbitMatB = new THREE.MeshBasicMaterial({ color: SAGE, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const satMat = glowMaterial();
    const satGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(R * 1.32, 0, 0)]);
    satGeo.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(new THREE.Color(AMBER).toArray()), 3));
    satGeo.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array([26]), 1));
    const satGeoB = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-R * 1.5, 0, 0)]);
    satGeoB.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(new THREE.Color(SKY).toArray()), 3));
    satGeoB.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array([20]), 1));

    const v = hubs[0];
    const initialSpin = -Math.atan2(v.x, v.z);

    return {
      dotGeo, dotMat, occluderMat, rimMat, hubs, hubGeo, hubMat, arcs, packetGeo, packetMat,
      ringMats, ringQuats, orbitMatA, orbitMatB, satMat, satGeo, satGeoB, initialSpin,
    };
  }, [dots]);

  useFrame((state, dt) => {
    const g = root.current;
    const vp = state.viewport;
    let scale: number;
    let visible: number;
    if (fill) {
      g.position.set(0, 0, 0);
      scale = (Math.min(vp.width, vp.height) * 0.27) / R;
      visible = 1;
    } else {
      if (!anchor.current || !anchor.current.isConnected) anchor.current = document.querySelector("[data-globe-anchor]");
      const el = anchor.current;
      if (!el) {
        g.visible = false;
        return;
      }
      const rect = el.getBoundingClientRect();
      const { width: sw, height: sh } = state.size;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      g.position.set((cx / sw - 0.5) * vp.width, -(cy / sh - 0.5) * vp.height, 0);
      scale = ((Math.min(rect.width, rect.height) / sh) * vp.height * 0.34) / R;
      visible = clamp((Math.min(rect.bottom, sh) - Math.max(rect.top, 0)) / Math.max(rect.height, 1), 0, 1);
    }
    g.scale.setScalar(scale);

    opacity.current = reduce ? visible : opacity.current + (visible - opacity.current) * Math.min(1, dt * 3);
    const o = opacity.current;
    g.visible = o > 0.01;
    if (!g.visible) return;

    const t = reduce ? 3 : state.clock.elapsedTime;
    const pr = state.gl.getPixelRatio();
    // Point sprites are sized in pixels; tie them to the globe's on-screen size (tuned at 800px tall).
    const pointScale = scale * (state.size.height / 800);
    spin.current.rotation.y = scene.initialSpin + (reduce ? 0 : t * 0.07);
    tilt.current.rotation.x += (0.32 - input.py * 0.18 - tilt.current.rotation.x) * 0.05;
    tilt.current.rotation.z += (-input.px * 0.1 - tilt.current.rotation.z) * 0.05;

    for (const m of [scene.dotMat, scene.hubMat, scene.packetMat, scene.satMat]) {
      m.uniforms.uOpacity.value = o;
      if (m.uniforms.uPixelRatio) m.uniforms.uPixelRatio.value = pr;
      if (m.uniforms.uScale) m.uniforms.uScale.value = pointScale;
    }
    scene.occluderMat.opacity = o * 0.93;
    scene.rimMat.uniforms.uOpacity.value = o;
    scene.orbitMatA.opacity = 0.35 * o;
    scene.orbitMatB.opacity = 0.25 * o;

    const pAttr = scene.packetGeo.getAttribute("position") as THREE.BufferAttribute;
    scene.arcs.forEach((a, i) => {
      const head = (t * a.speed + a.offset) % 1;
      a.mat.uniforms.uHead.value = head;
      a.mat.uniforms.uOpacity.value = o;
      a.curve.getPoint(head, tmp);
      pAttr.setXYZ(i, tmp.x, tmp.y, tmp.z);
    });
    pAttr.needsUpdate = true;

    rings.current.forEach((mesh, i) => {
      if (!mesh) return;
      const f = (t * 0.45 + i * 0.19) % 1;
      mesh.scale.setScalar(1 + f * (i === 0 ? 5 : 3));
      (mesh.material as THREE.MeshBasicMaterial).opacity = (1 - f) * 0.7 * o;
    });

    orbitA.current.rotation.z = t * 0.35;
    orbitB.current.rotation.z = -t * 0.22;
  });

  return (
    <group ref={root} visible={false}>
      <group ref={tilt} rotation={[0.32, 0, 0]}>
        <group ref={spin}>
          {/* Drawn first: hides the far side without covering the front dots/arcs. */}
          <mesh material={scene.occluderMat} renderOrder={-1}>
            <sphereGeometry args={[R * 0.985, 64, 64]} />
          </mesh>
          <points geometry={scene.dotGeo} material={scene.dotMat} />
          <mesh material={scene.rimMat}>
            <sphereGeometry args={[R * 1.02, 64, 64]} />
          </mesh>
          {scene.arcs.map((a, i) => (
            <primitive key={i} object={a.line} />
          ))}
          <points geometry={scene.packetGeo} material={scene.packetMat} />
          <points geometry={scene.hubGeo} material={scene.hubMat} />
          {scene.hubs.map((v, i) => (
            <mesh
              key={i}
              ref={(m) => {
                if (m) rings.current[i] = m;
              }}
              position={v.clone().multiplyScalar(1.006)}
              quaternion={scene.ringQuats[i]}
              material={scene.ringMats[i]}
            >
              <ringGeometry args={[0.035, 0.045, 40]} />
            </mesh>
          ))}
        </group>

        <group rotation={[1.25, 0.2, 0]}>
          <group ref={orbitA}>
            <mesh material={scene.orbitMatA}>
              <torusGeometry args={[R * 1.32, 0.004, 8, 200]} />
            </mesh>
            <points geometry={scene.satGeo} material={scene.satMat} />
          </group>
        </group>
        <group rotation={[1.8, -0.5, 0.3]}>
          <group ref={orbitB}>
            <mesh material={scene.orbitMatB}>
              <torusGeometry args={[R * 1.5, 0.003, 8, 220]} />
            </mesh>
            <points geometry={scene.satGeoB} material={scene.satMat} />
          </group>
        </group>
      </group>
    </group>
  );
}
