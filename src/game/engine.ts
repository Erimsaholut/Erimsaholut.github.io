import * as THREE from "three";
import { Sfx } from "./audio";
import { Particles, arcMaterial, dotsMaterial, fresnelMaterial, glowTexture, makeSprite } from "./visuals";

/*
 * Region Defender — DDoS traffic flies toward data-center regions on a globe.
 * Tap/click packets to block them, drag to rotate, spend credits on abilities.
 * Lose MAX_DOWN regions and the network goes down.
 */

export type Ability = "shield" | "scale" | "pulse";
export type Phase = "intro" | "playing" | "paused" | "over";

export const ABILITIES: Record<Ability, { name: string; cost: number; key: string; desc: string; how: string }> = {
  shield: {
    name: "WAF Shield",
    cost: 25,
    key: "1",
    desc: "Puts a shield on one region. It absorbs the next 3 hits (lasts 25 s).",
    how: "Tap the button, then tap a region on the globe.",
  },
  scale: {
    name: "Auto Scaling",
    cost: 30,
    key: "2",
    desc: "Repairs a region by +50 health — or brings a region that went down back online.",
    how: "Tap the button, then tap a damaged or offline region.",
  },
  pulse: {
    name: "Edge Pulse",
    cost: 45,
    key: "3",
    desc: "A shockwave from the globe that destroys every threat close to it.",
    how: "Fires instantly. Recharges for 12 seconds.",
  },
};

export const CREDIT_RULES = "Earn credits by blocking packets (+5, purple +12) and by clearing waves.";

export const MAX_DOWN = 4;
const PULSE_CD = 12;
const R = 1.6;

export interface HubView {
  name: string;
  hp: number;
  online: boolean;
  shield: number;
  danger: boolean;
}

export interface HudState {
  phase: Phase;
  score: number;
  best: number;
  wave: number;
  credits: number;
  online: number;
  total: number;
  combo: number;
  blocked: number;
  targeting: Ability | null;
  pulseCd: number;
  banner: { text: string; id: number } | null;
  hubs: HubView[];
  muted: boolean;
  denied: number;
  newBest: boolean;
  tap: { x: number; y: number; id: number; hit: boolean } | null;
}

const C = {
  amber: new THREE.Color("#FFB547"),
  sage: new THREE.Color("#93D3A2"),
  sky: new THREE.Color("#8FB0EC"),
  red: new THREE.Color("#FF5A4F"),
  purple: new THREE.Color("#B98CFF"),
  pink: new THREE.Color("#FF6FD8"),
  ink: new THREE.Color("#ECE8DF"),
  cyan: new THREE.Color("#7FE7FF"),
  white: new THREE.Color("#FFFFFF"),
};

const HUBS: [string, number, number][] = [
  ["Torino", 45.07, 7.69],
  ["Frankfurt", 50.11, 8.68],
  ["Dublin", 53.35, -6.26],
  ["Stockholm", 59.33, 18.07],
  ["N. Virginia", 38.95, -77.45],
  ["Oregon", 45.84, -119.7],
  ["São Paulo", -23.55, -46.63],
  ["Mumbai", 19.08, 72.88],
  ["Singapore", 1.35, 103.82],
  ["Tokyo", 35.68, 139.69],
  ["Sydney", -33.87, 151.21],
  ["Manisa", 38.62, 27.43],
];

// Home regions (where I've studied) are drawn in amber.
const isHome = (i: number) => i === 0 || i === 11;

const ARCS: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 7], [0, 8], [0, 9], [0, 6], [0, 11], [11, 7], [11, 1],
  [4, 5], [4, 6], [2, 4], [8, 9], [8, 10], [7, 8], [1, 3], [5, 9],
];

function latLon(lat: number, lon: number, r = R) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const th = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);

type Kind = "basic" | "heavy" | "swarm";

interface Threat {
  kind: Kind;
  hp: number;
  start: THREE.Vector3;
  ctrl: THREE.Vector3;
  end: THREE.Vector3;
  target: number;
  u: number;
  dur: number;
  pos: THREE.Vector3;
  core: THREE.Sprite;
  halo: THREE.Sprite;
  flash: number;
  seed: number;
  dead: boolean;
}

interface Hub {
  name: string;
  local: THREE.Vector3;
  hp: number;
  shownHp: number;
  online: boolean;
  shield: number;
  shieldUntil: number;
  flash: number;
  danger: boolean;
  core: THREE.Sprite;
  ring: THREE.Mesh;
  hpRing: THREE.Mesh;
  bubble: THREE.Mesh;
  warn: THREE.Sprite;
}

interface Shock {
  mesh: THREE.Mesh;
  t: number;
}

function ringGeo(frac: number) {
  return new THREE.RingGeometry(0.1, 0.125, 48, 1, Math.PI / 2, Math.max(0.001, Math.PI * 2 * frac));
}

export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(42, 1, 0.1, 300);
  private camBase = new THREE.Vector3(0, 0, 7);
  private world = new THREE.Group();
  private spin = new THREE.Group();
  private clock = new THREE.Clock();
  private glow = glowTexture();
  private particles: Particles;
  private dotsMat = dotsMaterial();
  private arcs: { mat: THREE.ShaderMaterial; a: number; b: number; speed: number; offset: number; color: THREE.Color }[] = [];
  private hubs: Hub[] = [];
  private threats: Threat[] = [];
  private shocks: Shock[] = [];
  private sfx = new Sfx();
  private ro: ResizeObserver;
  private raf = 0;
  private disposed = false;

  private time = 0;
  private gameTime = 0;
  private phase: Phase = "intro";
  private score = 0;
  private best = 0;
  private wave = 0;
  private credits = 0;
  private blocked = 0;
  private combo = 0;
  private comboTimer = 0;
  private toSpawn = 0;
  private spawnTimer = 0;
  private inBreak = false;
  private breakTimer = 0;
  private pulseCd = 0;
  private targeting: Ability | null = null;
  private banner: HudState["banner"] = null;
  private bannerId = 0;
  private denied = 0;
  private newBest = false;
  private muted = false;
  private tap: HudState["tap"] = null;
  private tapId = 0;
  private hudTimer = 0;
  private shake = 0;
  private danger = 0;
  private trailToggle = false;

  private tilt = 0.35;
  private spinVel = 0;
  private drag: { id: number; lastX: number; lastY: number; moved: number; t: number } | null = null;
  private size = { w: 1, h: 1 };
  private v1 = new THREE.Vector3();
  private v2 = new THREE.Vector3();

  constructor(
    private canvas: HTMLCanvasElement,
    private onHud: (h: HudState) => void,
    private opts: { lite: boolean; reduceMotion: boolean }
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.lite ? 1.5 : 2));
    this.renderer.setClearColor("#07080A");
    this.scene.add(this.world);
    this.world.add(this.spin);
    this.world.rotation.x = this.tilt;
    this.particles = new Particles(opts.lite ? 1100 : 2200);
    this.spin.add(this.particles.points);

    this.buildStars();
    this.buildGlobe();
    this.buildHubs();
    this.buildArcs();

    try {
      this.best = Number(localStorage.getItem("rd-best") || 0) || 0;
      this.muted = localStorage.getItem("rd-muted") === "1";
    } catch {
      /* storage unavailable */
    }
    this.sfx.muted = this.muted;

    canvas.addEventListener("pointerdown", this.onDown);
    canvas.addEventListener("pointermove", this.onMove);
    canvas.addEventListener("pointerup", this.onUp);
    canvas.addEventListener("pointercancel", this.onCancel);
    document.addEventListener("visibilitychange", this.onVisibility);

    this.ro = new ResizeObserver(() => this.fit());
    this.ro.observe(canvas);
    this.fit();
    this.raf = requestAnimationFrame(this.tick);
    this.emit();
    // Dev-only test hook (stripped from production builds).
    if (import.meta.env.DEV) (window as unknown as { __rd?: unknown }).__rd = this;
  }

  /** Dev/test helper: screen positions of live threats. */
  debugThreats() {
    this.scene.updateMatrixWorld();
    return this.threats
      .filter((t) => !t.dead)
      .map((t) => {
        const w = this.toScreen(t.pos, new THREE.Vector3());
        return { kind: t.kind, hp: t.hp, visible: this.visible(w.clone()), ...this.screenPos(w) };
      });
  }

  /* ---------------------------------------------------------------- scene */

  private buildStars() {
    const n = this.opts.lite ? 700 : 1400;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      this.v1.randomDirection().multiplyScalar(rand(40, 90));
      pos.set([this.v1.x, this.v1.y, this.v1.z], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ color: C.ink, size: 1.3, sizeAttenuation: false, transparent: true, opacity: 0.5, depthWrite: false });
    this.scene.add(new THREE.Points(g, m));
  }

  private buildGlobe() {
    const n = this.opts.lite ? 1700 : 2800;
    const pos = new Float32Array(n * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      pos.set([Math.cos(i * golden) * r * R, y * R, Math.sin(i * golden) * r * R], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.spin.add(new THREE.Points(g, this.dotsMat));

    const occ = new THREE.Mesh(new THREE.SphereGeometry(R * 0.985, 64, 48), new THREE.MeshBasicMaterial({ color: "#0A0C09" }));
    occ.renderOrder = -1;
    this.spin.add(occ);
    this.spin.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.025, 64, 48), fresnelMaterial(C.sky, 0.75, 2.6)));
    const halo = makeSprite(this.glow, C.sky, R * 4.4, { opacity: 0.14 });
    this.scene.add(halo);
  }

  private buildHubs() {
    HUBS.forEach(([name, la, lo], i) => {
      const local = latLon(la, lo);
      const normal = local.clone().normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      const color = isHome(i) ? C.amber : C.sage;

      const core = makeSprite(this.glow, color, isHome(i) ? 0.3 : 0.22);
      core.position.copy(local).multiplyScalar(1.012);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.05, 0.064, 40),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
      );
      ring.position.copy(local).multiplyScalar(1.005);
      ring.quaternion.copy(quat);

      const hpRing = new THREE.Mesh(ringGeo(1), new THREE.MeshBasicMaterial({ color: C.sage, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
      hpRing.position.copy(local).multiplyScalar(1.007);
      hpRing.quaternion.copy(quat);

      const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.26, 32, 24), fresnelMaterial(C.cyan, 0, 1.7));
      bubble.position.copy(local);
      bubble.visible = false;

      const warn = makeSprite(this.glow, C.red, 0.5, { depthTest: false });
      warn.renderOrder = 999;
      warn.position.copy(local).multiplyScalar(1.03);
      warn.visible = false;

      this.spin.add(core, ring, hpRing, bubble, warn);
      this.hubs.push({ name, local, hp: 100, shownHp: 100, online: true, shield: 0, shieldUntil: 0, flash: 0, danger: false, core, ring, hpRing, bubble, warn });
    });
    const v = this.hubs[0].local;
    this.spin.rotation.y = -Math.atan2(v.x, v.z);
  }

  private buildArcs() {
    ARCS.forEach(([a, b], i) => {
      const s = this.hubs[a].local;
      const e = this.hubs[b].local;
      const mid = s.clone().add(e).normalize().multiplyScalar(R * (1.08 + s.distanceTo(e) * 0.16));
      const pts = new THREE.QuadraticBezierCurve3(s, mid, e).getPoints(80);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      geo.setAttribute("aT", new THREE.BufferAttribute(new Float32Array(pts.map((_, k) => k / (pts.length - 1))), 1));
      const color = isHome(a) ? C.amber : i % 2 ? C.sky : C.sage;
      const mat = arcMaterial(color);
      this.spin.add(new THREE.Line(geo, mat));
      this.arcs.push({ mat, a, b, speed: 0.15 + (i % 5) * 0.035, offset: (i * 0.137) % 1, color });
    });
  }

  private fit() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.size = { w, h };
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    const half = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    // Portrait phones get a closer camera so the globe fills more of the narrow screen.
    const need = this.camera.aspect < 1 ? 2.2 : 2.6;
    const d = need / (half * Math.min(1, this.camera.aspect));
    this.camBase.set(0, w < 640 ? -0.15 : 0, clamp(d, 6.4, 15));
    this.camera.position.copy(this.camBase);
    this.camera.updateProjectionMatrix();
    const buf = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    const px = buf.y / (2 * half);
    this.dotsMat.uniforms.uScale.value = px;
    this.particles.material.uniforms.uScale.value = px;
  }

  /* ---------------------------------------------------------------- input */

  private onDown = (e: PointerEvent) => {
    if (this.drag) return;
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      /* not every pointer can be captured; dragging still works without it */
    }
    this.drag = { id: e.pointerId, lastX: e.clientX, lastY: e.clientY, moved: 0, t: performance.now() };
    this.spinVel = 0;
  };

  private onMove = (e: PointerEvent) => {
    const d = this.drag;
    if (d && e.pointerId === d.id) {
      const dx = e.clientX - d.lastX;
      const dy = e.clientY - d.lastY;
      d.lastX = e.clientX;
      d.lastY = e.clientY;
      d.moved += Math.abs(dx) + Math.abs(dy);
      if (d.moved > 8) {
        const k = 5 / Math.max(this.size.h, 320);
        this.spin.rotation.y += dx * k;
        this.tilt = clamp(this.tilt + dy * k * 0.7, -1.1, 1.1);
        this.spinVel = dx * k * 50;
      }
      return;
    }
    if (e.pointerType === "mouse") this.updateCursor(e);
  };

  private onUp = (e: PointerEvent) => {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    this.drag = null;
    if (d.moved <= 10 && performance.now() - d.t < 650) {
      const r = this.canvas.getBoundingClientRect();
      this.handleTap(e.clientX - r.left, e.clientY - r.top, e.pointerType);
    }
  };

  private onCancel = () => {
    this.drag = null;
  };

  private onVisibility = () => {
    if (document.hidden && this.phase === "playing") this.pause();
  };

  private updateCursor(e: PointerEvent) {
    if (this.phase !== "playing") {
      this.canvas.style.cursor = "grab";
      return;
    }
    const r = this.canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    this.scene.updateMatrixWorld();
    if (this.targeting) this.canvas.style.cursor = this.pickHub(x, y, 50) ? "pointer" : "cell";
    else this.canvas.style.cursor = this.pickThreat(x, y, 40) ? "pointer" : "crosshair";
  }

  /** Keyboard shortcuts; returns true when the key was used. */
  key(k: string) {
    const key = k.toLowerCase();
    if (key === "1") this.useAbility("shield");
    else if (key === "2") this.useAbility("scale");
    else if (key === "3" || key === " ") this.useAbility("pulse");
    else if (key === "p") this.togglePause();
    else if (key === "m") this.toggleMute();
    else if (key === "enter" && (this.phase === "intro" || this.phase === "over")) this.start();
    else return false;
    return true;
  }

  /* -------------------------------------------------------------- picking */

  private toScreen(local: THREE.Vector3, out: THREE.Vector3) {
    out.copy(local);
    this.spin.localToWorld(out);
    return out;
  }

  private visible(world: THREE.Vector3) {
    const cam = this.camera.position;
    const dir = this.v2.copy(world).sub(cam);
    const len = dir.length();
    dir.divideScalar(len);
    const b = cam.dot(dir);
    const c = cam.lengthSq() - R * R * 0.97;
    const disc = b * b - c;
    if (disc < 0) return true;
    const t = -b - Math.sqrt(disc);
    return t < 0 || t > len - 0.02;
  }

  private screenPos(world: THREE.Vector3) {
    const p = this.v2.copy(world).project(this.camera);
    return { x: ((p.x + 1) / 2) * this.size.w, y: ((1 - p.y) / 2) * this.size.h };
  }

  private pickThreat(x: number, y: number, radius: number) {
    let best: Threat | null = null;
    let bestD = Infinity;
    for (const t of this.threats) {
      if (t.dead) continue;
      const w = this.toScreen(t.pos, this.v1);
      if (!this.visible(w)) continue;
      const s = this.screenPos(w);
      const d = Math.hypot(s.x - x, s.y - y);
      const r = radius * (t.kind === "heavy" ? 1.3 : 1);
      if (d < r && d < bestD) {
        best = t;
        bestD = d;
      }
    }
    return best;
  }

  private pickHub(x: number, y: number, radius: number) {
    let best: Hub | null = null;
    let bestD = Infinity;
    for (const h of this.hubs) {
      const w = this.toScreen(h.local, this.v1);
      const facing = w.clone().normalize().dot(this.v2.copy(this.camera.position).sub(w).normalize());
      if (facing < 0.1) continue;
      const s = this.screenPos(w);
      const d = Math.hypot(s.x - x, s.y - y);
      if (d < radius && d < bestD) {
        best = h;
        bestD = d;
      }
    }
    return best;
  }

  private handleTap(x: number, y: number, pointerType: string) {
    if (this.phase !== "playing") return;
    this.scene.updateMatrixWorld();
    const radius = pointerType === "mouse" ? 40 : 56;
    if (this.targeting) {
      const hub = this.pickHub(x, y, radius + 18);
      if (hub) this.applyAbility(this.targeting, hub);
      else this.targeting = null;
      this.emit();
      return;
    }
    const t = this.pickThreat(x, y, radius);
    this.tap = { x, y, id: ++this.tapId, hit: !!t };
    if (t) this.shoot(t);
    else this.sfx.zap();
    this.emit();
  }

  /* ------------------------------------------------------------- gameplay */

  start() {
    this.sfx.init();
    this.sfx.click();
    for (const t of this.threats) this.dropThreat(t);
    this.threats = [];
    for (const h of this.hubs) {
      h.hp = 100;
      h.online = true;
      h.shield = 0;
      h.flash = 0;
    }
    this.score = 0;
    this.wave = 0;
    this.credits = 60;
    this.blocked = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.pulseCd = 0;
    this.gameTime = 0;
    this.inBreak = false;
    this.targeting = null;
    this.newBest = false;
    this.phase = "playing";
    if (!this.muted) this.sfx.startPad();
    this.startWave();
    this.emit();
  }

  pause() {
    if (this.phase !== "playing") return;
    this.phase = "paused";
    this.sfx.suspend();
    this.emit();
  }

  resume() {
    if (this.phase !== "paused") return;
    this.phase = "playing";
    this.sfx.resume();
    this.clock.getDelta();
    this.emit();
  }

  togglePause() {
    if (this.phase === "playing") this.pause();
    else if (this.phase === "paused") this.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    this.sfx.setMuted(this.muted);
    if (!this.muted && this.phase === "playing") this.sfx.startPad();
    try {
      localStorage.setItem("rd-muted", this.muted ? "1" : "0");
    } catch {
      /* ignore */
    }
    this.emit();
  }

  cancelTargeting() {
    if (!this.targeting) return false;
    this.targeting = null;
    this.emit();
    return true;
  }

  useAbility(a: Ability) {
    if (this.phase !== "playing") return;
    const cost = ABILITIES[a].cost;
    if (a === "pulse") {
      if (this.pulseCd > 0 || this.credits < cost) return this.deny();
      this.credits -= cost;
      this.pulseCd = PULSE_CD;
      this.edgePulse();
    } else {
      if (this.targeting === a) this.targeting = null;
      else if (this.credits < cost) return this.deny();
      else {
        this.targeting = a;
        this.sfx.click();
      }
    }
    this.emit();
  }

  private deny(text?: string) {
    this.denied = performance.now();
    this.sfx.deny();
    if (text) this.showBanner(text);
    this.emit();
  }

  private applyAbility(a: Ability, hub: Hub) {
    const cost = ABILITIES[a].cost;
    if (this.credits < cost) return this.deny();
    if (a === "shield") {
      if (!hub.online) return this.deny(`${hub.name} is down — use Auto Scaling`);
      hub.shield = 3;
      hub.shieldUntil = this.gameTime + 25;
      this.particles.burst(hub.local, C.cyan, 30, 1.4, 0.08, 0.6);
      this.sfx.shield();
      this.showBanner(`WAF Shield up on ${hub.name}`);
    } else if (a === "scale") {
      if (hub.online && hub.hp >= 100) return this.deny(`${hub.name} is already at full capacity`);
      if (!hub.online) {
        hub.online = true;
        hub.hp = 50;
        this.showBanner(`${hub.name} is back online`);
      } else {
        hub.hp = Math.min(100, hub.hp + 50);
        this.showBanner(`${hub.name} scaled up`);
      }
      this.particles.burst(hub.local, C.sage, 40, 1.6, 0.09, 0.7);
      this.sfx.heal();
    }
    this.credits -= cost;
    this.targeting = null;
  }

  private edgePulse() {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), fresnelMaterial(C.amber, 1, 1.4));
    mesh.scale.setScalar(R);
    this.world.add(mesh);
    this.shocks.push({ mesh, t: 0 });
    this.sfx.pulse();
    if (!this.opts.reduceMotion) this.shake = Math.min(1.4, this.shake + 0.7);
    let n = 0;
    for (const t of this.threats) {
      if (!t.dead && t.pos.length() < 5.4) {
        this.kill(t, false);
        n++;
      }
    }
    this.showBanner(n ? `Edge Pulse cleared ${n} threat${n > 1 ? "s" : ""}` : "Edge Pulse fired");
  }

  private showBanner(text: string) {
    this.banner = { text, id: ++this.bannerId };
  }

  private startWave() {
    this.wave++;
    this.toSpawn = 5 + 2 * (this.wave - 1);
    this.spawnTimer = 1.4;
    this.inBreak = false;
    const w = this.wave;
    const sub =
      w === 1 ? "Incoming traffic" : w === 4 ? "Heavy payloads detected" : w === 6 ? "Botnet swarms detected" : w % 5 === 0 ? "Traffic spike!" : "Traffic rising";
    this.showBanner(`Wave ${w} · ${sub}`);
    this.sfx.wave();
  }

  private color(kind: Kind) {
    return kind === "heavy" ? C.purple : kind === "swarm" ? C.pink : C.red;
  }

  private spawn() {
    const online = this.hubs.map((h, i) => (h.online ? i : -1)).filter((i) => i >= 0);
    if (!online.length) return;
    const w = this.wave;
    const roll = Math.random();
    const heavy = w >= 4 ? Math.min(0.25, 0.06 * (w - 3)) : 0;
    const swarm = w >= 6 ? Math.min(0.2, 0.05 * (w - 5)) : 0;
    const kind: Kind = roll < heavy ? "heavy" : roll < heavy + swarm ? "swarm" : "basic";
    const target = online[Math.floor(Math.random() * online.length)];
    const end = this.hubs[target].local.clone();
    const dir = end.clone().normalize().add(this.v1.randomDirection().multiplyScalar(1.15)).normalize();
    const start = dir.multiplyScalar(rand(5.6, 7));
    const travel = Math.max(4.4, 10 - 0.36 * (w - 1)) * (kind === "heavy" ? 1.35 : kind === "swarm" ? 1.1 : 1) * rand(0.85, 1.15);
    this.addThreat(kind, start, end, target, travel);
  }

  private addThreat(kind: Kind, start: THREE.Vector3, end: THREE.Vector3, target: number, dur: number) {
    const mid = start.clone().lerp(end, 0.5);
    const ctrl = mid
      .normalize()
      .multiplyScalar(Math.max(start.length() * 0.62, R * 1.9))
      .add(this.v1.randomDirection().multiplyScalar(0.7));
    const color = this.color(kind);
    const core = makeSprite(this.glow, color, kind === "heavy" ? 0.36 : 0.24);
    const halo = makeSprite(this.glow, color, kind === "heavy" ? 0.95 : 0.6, { opacity: 0.35 });
    core.position.copy(start);
    halo.position.copy(start);
    this.spin.add(core, halo);
    this.threats.push({ kind, hp: kind === "heavy" ? 3 : 1, start, ctrl, end, target, u: 0, dur, pos: start.clone(), core, halo, flash: 0, seed: Math.random() * 10, dead: false });
  }

  private dropThreat(t: Threat) {
    t.dead = true;
    this.spin.remove(t.core, t.halo);
    t.core.material.dispose();
    t.halo.material.dispose();
  }

  private shoot(t: Threat) {
    t.hp -= 1;
    if (t.hp > 0) {
      t.flash = 1;
      this.particles.burst(t.pos, this.color(t.kind), 12, 1.3, 0.07, 0.35);
      this.sfx.spark();
      return;
    }
    this.kill(t, true);
  }

  private kill(t: Threat, byPlayer: boolean) {
    const color = this.color(t.kind);
    const big = t.kind === "heavy";
    this.dropThreat(t);
    this.particles.burst(t.pos, color, big ? 70 : 38, big ? 2.8 : 2, big ? 0.13 : 0.1, 0.75);
    this.particles.burst(t.pos, C.ink, 10, 0.9, 0.06, 0.4);
    this.blocked++;
    if (byPlayer) {
      this.combo = this.comboTimer > 0 ? this.combo + 1 : 1;
      this.comboTimer = 1.6;
    }
    const mult = byPlayer ? 1 + Math.min(this.combo - 1, 10) * 0.15 : 1;
    this.score += Math.round((big ? 30 : 10) * mult);
    this.credits += big ? 12 : 5;
    this.sfx.pop();
  }

  private impact(t: Threat) {
    this.dropThreat(t);
    const hub = this.hubs[t.target];
    if (!hub.online) {
      this.particles.burst(t.pos, C.red, 12, 1, 0.07, 0.4);
      return;
    }
    if (hub.shield > 0) {
      hub.shield--;
      hub.flash = 1;
      this.particles.burst(t.pos, C.cyan, 30, 1.7, 0.08, 0.5);
      this.sfx.shield();
      return;
    }
    hub.hp = Math.max(0, hub.hp - (t.kind === "heavy" ? 35 : 15));
    hub.flash = 1;
    this.particles.burst(hub.local, C.red, 44, 2.2, 0.1, 0.7);
    if (!this.opts.reduceMotion) this.shake = Math.min(1.3, this.shake + (t.kind === "heavy" ? 0.9 : 0.5));
    this.sfx.hit();
    if (hub.hp <= 0) {
      hub.online = false;
      hub.shield = 0;
      this.sfx.down();
      this.particles.burst(hub.local, C.red, 100, 3, 0.13, 1.1);
      const down = this.hubs.filter((h) => !h.online).length;
      this.showBanner(`${hub.name} is down · ${down}/${MAX_DOWN}`);
      if (down >= MAX_DOWN) this.gameOver();
    }
  }

  private gameOver() {
    this.phase = "over";
    this.targeting = null;
    this.sfx.stopPad();
    this.sfx.over();
    if (this.score > this.best) {
      this.best = this.score;
      this.newBest = true;
      try {
        localStorage.setItem("rd-best", String(this.best));
      } catch {
        /* ignore */
      }
    }
    this.emit();
  }

  private bezier(t: Threat, u: number, out: THREE.Vector3) {
    const a = (1 - u) * (1 - u);
    const b = 2 * (1 - u) * u;
    const c = u * u;
    return out.set(
      a * t.start.x + b * t.ctrl.x + c * t.end.x,
      a * t.start.y + b * t.ctrl.y + c * t.end.y,
      a * t.start.z + b * t.ctrl.z + c * t.end.z
    );
  }

  private update(dt: number) {
    this.gameTime += dt;

    if (this.toSpawn > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawn();
        this.toSpawn--;
        this.spawnTimer = Math.max(0.65, 2.2 - 0.12 * (this.wave - 1)) * rand(0.75, 1.25);
      }
    }

    this.trailToggle = !this.trailToggle;
    const emitTrail = !this.opts.lite || this.trailToggle;
    const spawned: Threat[] = [];
    for (const t of this.threats) {
      if (t.dead) continue;
      t.u += dt / t.dur;
      if (t.kind === "swarm" && t.u > 0.5) {
        // Botnet swarm splits into three faster packets.
        const online = this.hubs.map((h, i) => (h.online ? i : -1)).filter((i) => i >= 0);
        const remaining = (1 - t.u) * t.dur;
        this.particles.burst(t.pos, C.pink, 30, 1.6, 0.08, 0.5);
        this.dropThreat(t);
        if (online.length) {
          for (let k = 0; k < 3; k++) {
            const target = online[Math.floor(Math.random() * online.length)];
            const before = this.threats.length;
            this.addThreat("basic", t.pos.clone(), this.hubs[target].local.clone(), target, Math.max(2.2, remaining * rand(1, 1.3)));
            spawned.push(this.threats.splice(before, 1)[0]);
          }
        }
        continue;
      }
      if (t.u >= 1) {
        this.impact(t);
        continue;
      }
      this.bezier(t, t.u, t.pos);
      t.core.position.copy(t.pos);
      t.halo.position.copy(t.pos);
      if (emitTrail) {
        const c = this.color(t.kind);
        this.particles.emit(t.pos, rand(-0.05, 0.05), rand(-0.05, 0.05), rand(-0.05, 0.05), c, t.kind === "heavy" ? 0.12 : 0.085, 0.45);
      }
    }
    this.threats = this.threats.filter((t) => !t.dead).concat(spawned);

    if (!this.inBreak && this.toSpawn === 0 && this.threats.length === 0 && this.phase === "playing") {
      this.inBreak = true;
      this.breakTimer = 3;
      const bonus = 15 + 5 * this.wave;
      this.credits += bonus;
      this.score += 50 * this.wave;
      this.showBanner(`Wave ${this.wave} cleared · +${bonus} credits`);
    }
    if (this.inBreak) {
      this.breakTimer -= dt;
      if (this.breakTimer <= 0) this.startWave();
    }

    this.hubs.forEach((h, i) => {
      if (h.shield > 0 && this.gameTime > h.shieldUntil) h.shield = 0;
      h.danger = h.online && this.threats.some((t) => t.target === i && t.u > 0.55);
    });
    this.pulseCd = Math.max(0, this.pulseCd - dt);
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
  }

  /* --------------------------------------------------------------- render */

  private animate(dt: number) {
    const t = this.time;
    if (!this.drag) {
      const auto = this.phase === "playing" ? 0.022 : 0.09;
      this.spin.rotation.y += (auto + this.spinVel) * dt;
      this.spinVel *= Math.pow(0.04, dt);
    }
    this.world.rotation.x += (this.tilt - this.world.rotation.x) * Math.min(1, dt * 8);

    const down = this.hubs.filter((h) => !h.online).length;
    this.danger += (down / MAX_DOWN - this.danger) * Math.min(1, dt * 2);
    this.dotsMat.uniforms.uDanger.value = this.danger;

    for (const a of this.arcs) {
      const ok = this.hubs[a.a].online && this.hubs[a.b].online;
      a.mat.uniforms.uHead.value = (t * a.speed + a.offset) % 1;
      (a.mat.uniforms.uColor.value as THREE.Color).copy(ok ? a.color : C.red);
      a.mat.uniforms.uOpacity.value = ok ? 0.9 : 0.3;
    }

    this.hubs.forEach((h, i) => {
      const base = !h.online ? C.red : isHome(i) ? C.amber : C.sage;
      h.flash *= Math.pow(0.02, dt);
      const coreMat = h.core.material;
      coreMat.color.copy(base).lerp(C.white, h.flash * 0.8);
      coreMat.opacity = h.online ? 1 : 0.45 + 0.35 * Math.sin(t * 3 + i);
      h.core.scale.setScalar((isHome(i) ? 0.3 : 0.22) * (1 + h.flash * 0.8));

      const f = (t * (h.online ? 0.5 : 0.25) + i * 0.19) % 1;
      h.ring.scale.setScalar(1 + f * 3.2);
      const ringMat = h.ring.material as THREE.MeshBasicMaterial;
      ringMat.color.copy(base);
      ringMat.opacity = (1 - f) * (h.online ? 0.6 : 0.4);

      h.hpRing.visible = h.online;
      if (Math.abs(h.hp - h.shownHp) > 0.5) {
        h.shownHp += (h.hp - h.shownHp) * Math.min(1, dt * 8);
        h.hpRing.geometry.dispose();
        h.hpRing.geometry = ringGeo(h.shownHp / 100);
      }
      (h.hpRing.material as THREE.MeshBasicMaterial).color.copy(h.hp > 60 ? C.sage : h.hp > 30 ? C.amber : C.red);

      h.bubble.visible = h.shield > 0;
      if (h.bubble.visible) {
        const m = h.bubble.material as THREE.ShaderMaterial;
        m.uniforms.uOpacity.value = 0.55 + 0.25 * Math.sin(t * 4 + i) + h.flash;
      }

      h.warn.visible = h.danger;
      if (h.danger) {
        h.warn.scale.setScalar(0.42 + 0.14 * Math.sin(t * 14));
        h.warn.material.opacity = 0.55 + 0.35 * Math.sin(t * 14);
      }
    });

    for (const th of this.threats) {
      th.flash *= Math.pow(0.01, dt);
      th.core.material.color.copy(this.color(th.kind)).lerp(C.white, th.flash);
      th.halo.scale.setScalar((th.kind === "heavy" ? 0.95 : 0.6) * (1 + 0.18 * Math.sin(t * 9 + th.seed)));
    }

    this.shocks = this.shocks.filter((s) => {
      s.t += dt;
      const k = s.t / 0.75;
      s.mesh.scale.setScalar(R + k * 5);
      (s.mesh.material as THREE.ShaderMaterial).uniforms.uOpacity.value = Math.max(0, 1 - k) * 1.2;
      if (k >= 1) {
        this.world.remove(s.mesh);
        s.mesh.geometry.dispose();
        (s.mesh.material as THREE.Material).dispose();
        return false;
      }
      return true;
    });

    this.particles.update(dt);

    this.shake *= Math.pow(0.015, dt);
    this.camera.position.copy(this.camBase);
    if (this.shake > 0.01) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake * 0.18;
      this.camera.position.y += (Math.random() - 0.5) * this.shake * 0.18;
    }
  }

  private tick = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.tick);
    const dt = Math.min(0.05, this.clock.getDelta());
    this.time += dt;
    if (this.phase === "playing") this.update(dt);
    this.animate(dt);
    this.renderer.render(this.scene, this.camera);
    this.hudTimer -= dt;
    if (this.hudTimer <= 0) this.emit();
  };

  private emit() {
    this.hudTimer = 0.1;
    const online = this.hubs.filter((h) => h.online).length;
    this.onHud({
      phase: this.phase,
      score: this.score,
      best: Math.max(this.best, this.score),
      wave: this.wave,
      credits: this.credits,
      online,
      total: this.hubs.length,
      combo: this.comboTimer > 0 ? this.combo : 0,
      blocked: this.blocked,
      targeting: this.targeting,
      pulseCd: this.pulseCd / PULSE_CD,
      banner: this.banner,
      hubs: this.hubs.map((h) => ({ name: h.name, hp: Math.round(h.hp), online: h.online, shield: h.shield, danger: h.danger })),
      muted: this.muted,
      denied: this.denied,
      newBest: this.newBest,
      tap: this.tap,
    });
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.canvas.removeEventListener("pointerdown", this.onDown);
    this.canvas.removeEventListener("pointermove", this.onMove);
    this.canvas.removeEventListener("pointerup", this.onUp);
    this.canvas.removeEventListener("pointercancel", this.onCancel);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.sfx.close();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    });
    this.glow.dispose();
    this.renderer.dispose();
  }
}
