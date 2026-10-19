/* Procedural sound effects (Web Audio) — no audio files. */

type Ctor = typeof AudioContext;

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private pad: { stop: () => void } | null = null;
  private noiseBuf: AudioBuffer | null = null;
  muted = false;

  /** Must be called from a user gesture (browser autoplay rules). */
  init() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const AC: Ctor | undefined = window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.32;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.32, this.ctx.currentTime, 0.05);
  }

  suspend() {
    void this.ctx?.suspend();
  }
  resume() {
    void this.ctx?.resume();
  }

  private tone(f0: number, f1: number, dur: number, type: OscillatorType, vol: number, delay = 0) {
    const c = this.ctx;
    if (!c || !this.master) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  private noise(dur: number, vol: number, freq: number, delay = 0) {
    const c = this.ctx;
    if (!c || !this.master || !this.noiseBuf) return;
    const t = c.currentTime + delay;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(freq, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 0.15), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.03);
  }

  zap() {
    this.tone(1500, 420, 0.08, "square", 0.05);
  }
  pop() {
    this.tone(480, 1500, 0.07, "triangle", 0.09);
    this.noise(0.22, 0.16, 2600);
  }
  spark() {
    this.tone(900, 300, 0.07, "sawtooth", 0.05);
  }
  hit() {
    this.noise(0.4, 0.34, 900);
    this.tone(150, 55, 0.35, "sine", 0.28);
  }
  shield() {
    this.tone(620, 940, 0.16, "sine", 0.11);
    this.tone(940, 1400, 0.18, "sine", 0.07, 0.05);
  }
  heal() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, f * 1.01, 0.22, "triangle", 0.08, i * 0.06));
  }
  pulse() {
    this.noise(1, 0.42, 3400);
    this.tone(110, 38, 1, "sine", 0.4);
  }
  down() {
    this.tone(440, 90, 0.8, "sawtooth", 0.1);
    this.noise(0.8, 0.25, 1200, 0.05);
  }
  wave() {
    [392, 523.25, 659.25].forEach((f, i) => this.tone(f, f, 0.14, "square", 0.045, i * 0.09));
  }
  deny() {
    this.tone(220, 170, 0.12, "square", 0.05);
    this.tone(170, 140, 0.12, "square", 0.05, 0.1);
  }
  over() {
    [523.25, 440, 349.23, 261.63].forEach((f, i) => this.tone(f, f * 0.98, 0.38, "triangle", 0.1, i * 0.2));
  }
  click() {
    this.tone(700, 900, 0.04, "sine", 0.05);
  }

  /** Quiet ambient drone while playing. */
  startPad() {
    const c = this.ctx;
    if (!c || !this.master || this.pad) return;
    const out = c.createGain();
    out.gain.setValueAtTime(0.0001, c.currentTime);
    out.gain.exponentialRampToValueAtTime(0.05, c.currentTime + 2);
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain).connect(lp.frequency);
    const oscs = [55, 55.4, 82.41].map((f) => {
      const o = c.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      o.connect(lp);
      o.start();
      return o;
    });
    lp.connect(out).connect(this.master);
    lfo.start();
    this.pad = {
      stop: () => {
        const t = c.currentTime;
        out.gain.setTargetAtTime(0.0001, t, 0.3);
        [...oscs, lfo].forEach((o) => o.stop(t + 1.2));
      },
    };
  }

  stopPad() {
    this.pad?.stop();
    this.pad = null;
  }

  close() {
    this.stopPad();
    void this.ctx?.close();
    this.ctx = null;
  }
}
