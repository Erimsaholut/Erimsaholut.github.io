import * as THREE from "three";

/* Materials, textures and the particle system for Region Defender — all generated in code. */

export function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.18, "rgba(255,255,255,0.9)");
  grd.addColorStop(0.42, "rgba(255,255,255,0.28)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeSprite(tex: THREE.Texture, color: THREE.Color, size: number, opts: { opacity?: number; depthTest?: boolean } = {}) {
  const m = new THREE.SpriteMaterial({
    map: tex,
    color: color.clone(),
    transparent: true,
    depthWrite: false,
    depthTest: opts.depthTest ?? true,
    opacity: opts.opacity ?? 1,
    blending: THREE.AdditiveBlending,
  });
  const s = new THREE.Sprite(m);
  s.scale.setScalar(size);
  return s;
}

export function dotsMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 1 }, uDanger: { value: 0 } },
    vertexShader: /* glsl */ `
      uniform float uScale;
      varying float vAlpha;
      varying float vLand;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vec3 n = normalize(wp.xyz);
        vec3 v = normalize(cameraPosition - wp.xyz);
        float facing = dot(n, v);
        vec3 p = normalize(position);
        float land = sin(p.x * 4.1 + 1.3) * sin(p.y * 3.3 + 0.7) * sin(p.z * 3.7 + 2.1) + 0.45 * sin(p.x * 9.0 + p.z * 7.0);
        vLand = smoothstep(-0.05, 0.45, land);
        vAlpha = (0.16 + 0.8 * vLand) * smoothstep(-0.2, 0.35, facing);
        vec4 mv = viewMatrix * wp;
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (0.02 + 0.017 * vLand) * uScale / -mv.z;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uDanger;
      varying float vAlpha;
      varying float vLand;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.15, d);
        vec3 c = mix(vec3(0.93, 0.91, 0.87), vec3(0.58, 0.83, 0.64), vLand * 0.25);
        c = mix(c, vec3(1.0, 0.35, 0.31), uDanger * 0.6 * vLand);
        gl_FragColor = vec4(c, a * vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
  });
}

/** Rim-lit additive shell: globe atmosphere, shield bubbles, shockwaves. */
export function fresnelMaterial(color: THREE.Color, opacity: number, power: number) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: color.clone() }, uOpacity: { value: opacity }, uPower: { value: power } },
    vertexShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uPower;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float f = pow(1.0 - max(dot(vN, vV), 0.0), uPower);
        gl_FragColor = vec4(uColor, f * uOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

export function arcMaterial(color: THREE.Color) {
  return new THREE.ShaderMaterial({
    uniforms: { uHead: { value: 0 }, uOpacity: { value: 1 }, uColor: { value: color.clone() } },
    vertexShader: /* glsl */ `
      attribute float aT;
      varying float vT;
      void main() {
        vT = aT;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uHead;
      uniform float uOpacity;
      uniform vec3 uColor;
      varying float vT;
      void main() {
        float d = uHead - vT;
        float trail = d > 0.0 ? exp(-d * 6.0) : 0.0;
        gl_FragColor = vec4(uColor * (0.8 + trail), (0.18 + trail) * uOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/** Pooled, CPU-simulated glowing particles (trails, sparks, explosions). Sizes are in world units. */
export class Particles {
  readonly points: THREE.Points;
  readonly material: THREE.ShaderMaterial;
  private pos: Float32Array;
  private vel: Float32Array;
  private col: Float32Array;
  private alpha: Float32Array;
  private size: Float32Array;
  private base: Float32Array;
  private life: Float32Array;
  private max: Float32Array;
  private next = 0;
  private geo: THREE.BufferGeometry;

  constructor(private count: number) {
    this.pos = new Float32Array(count * 3);
    this.vel = new Float32Array(count * 3);
    this.col = new Float32Array(count * 3);
    this.alpha = new Float32Array(count);
    this.size = new Float32Array(count);
    this.base = new Float32Array(count);
    this.life = new Float32Array(count);
    this.max = new Float32Array(count);
    this.geo = new THREE.BufferGeometry();
    const attr = (a: Float32Array, n: number) => new THREE.BufferAttribute(a, n).setUsage(THREE.DynamicDrawUsage);
    this.geo.setAttribute("position", attr(this.pos, 3));
    this.geo.setAttribute("aColor", attr(this.col, 3));
    this.geo.setAttribute("aAlpha", attr(this.alpha, 1));
    this.geo.setAttribute("aSize", attr(this.size, 1));
    this.material = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 1 } },
      vertexShader: /* glsl */ `
        uniform float uScale;
        attribute vec3 aColor;
        attribute float aAlpha;
        attribute float aSize;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize * uScale / -mv.z;
          vColor = aColor;
          vAlpha = aAlpha;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = pow(smoothstep(0.5, 0.0, d), 1.6) * vAlpha;
          if (a < 0.01) discard;
          gl_FragColor = vec4(vColor, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(this.geo, this.material);
    this.points.frustumCulled = false;
  }

  emit(p: THREE.Vector3, vx: number, vy: number, vz: number, color: THREE.Color, size: number, life: number) {
    const i = this.next;
    this.next = (this.next + 1) % this.count;
    this.pos[i * 3] = p.x;
    this.pos[i * 3 + 1] = p.y;
    this.pos[i * 3 + 2] = p.z;
    this.vel[i * 3] = vx;
    this.vel[i * 3 + 1] = vy;
    this.vel[i * 3 + 2] = vz;
    this.col[i * 3] = color.r;
    this.col[i * 3 + 1] = color.g;
    this.col[i * 3 + 2] = color.b;
    this.base[i] = size;
    this.size[i] = size;
    this.life[i] = life;
    this.max[i] = life;
    this.alpha[i] = 1;
  }

  burst(p: THREE.Vector3, color: THREE.Color, n: number, speed: number, size: number, life: number) {
    for (let k = 0; k < n; k++) {
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      const s = speed * (0.3 + 0.7 * Math.random());
      this.emit(p, Math.cos(th) * r * s, u * s, Math.sin(th) * r * s, color, size * (0.6 + 0.8 * Math.random()), life * (0.6 + 0.8 * Math.random()));
    }
  }

  update(dt: number) {
    const drag = Math.exp(-2.6 * dt);
    for (let i = 0; i < this.count; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        this.alpha[i] = 0;
        continue;
      }
      const k = this.life[i] / this.max[i];
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.vel[i * 3] *= drag;
      this.vel[i * 3 + 1] *= drag;
      this.vel[i * 3 + 2] *= drag;
      this.alpha[i] = k;
      this.size[i] = this.base[i] * (0.35 + 0.65 * k);
    }
    for (const name of ["position", "aColor", "aAlpha", "aSize"]) this.geo.getAttribute(name).needsUpdate = true;
  }
}
