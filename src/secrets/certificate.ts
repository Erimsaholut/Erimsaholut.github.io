/* The "Certified Secret Hunter" reward, drawn on a canvas so it can be saved as a PNG. */

export interface CertInfo {
  name: string;
  total: number;
  /** When the first and the last secret were found (unix ms). */
  first: number;
  last: number;
}

export const CERT_W = 1600;
export const CERT_H = 1000;

const C = { bg: "#131209", ink: "#ECE8DF", muted: "#A2A499", faint: "#6F7268", amber: "#FFB547" };
const DISPLAY = '"Geist Variable", system-ui, sans-serif';
const SANS = '"Geist Variable", system-ui, sans-serif';
const MONO = '"Geist Mono Variable", ui-monospace, monospace';

export function credentialId({ first, last, total }: CertInfo) {
  let h = 0x811c9dc5; // FNV-1a over the timestamps — the same progress always gives the same ID
  for (const ch of `${first}:${last}:${total}`) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0;
  const s = h.toString(36).toUpperCase().padStart(7, "0");
  return `EO-SH-${s.slice(0, 4)}-${s.slice(4)}${total}`;
}

export function duration(ms: number) {
  const min = Math.max(1, Math.round(ms / 60000));
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"}`;
  const h = Math.round(min / 60);
  if (h < 48) return `${h} hour${h === 1 ? "" : "s"}`;
  return `${Math.round(h / 24)} days`;
}

/** Text with manual letter spacing (canvas letterSpacing isn't everywhere yet). */
function spaced(g: CanvasRenderingContext2D, text: string, x: number, y: number, gap: number, align: "left" | "center" | "right") {
  const chars = [...text];
  const width = chars.reduce((w, ch) => w + g.measureText(ch).width, 0) + gap * (chars.length - 1);
  let cx = align === "center" ? x - width / 2 : align === "right" ? x - width : x;
  const prev = g.textAlign;
  g.textAlign = "left";
  for (const ch of chars) {
    g.fillText(ch, cx, y);
    cx += g.measureText(ch).width + gap;
  }
  g.textAlign = prev;
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function logo(g: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const k = size / 32;
  g.fillStyle = C.ink;
  for (const [rx, ry, rw, rh] of [
    [5, 9, 3, 14],
    [5, 9, 9, 3],
    [5, 14.5, 7, 3],
    [5, 20, 9, 3],
  ]) {
    roundRect(g, x + rx * k, y + ry * k, rw * k, rh * k, k);
    g.fill();
  }
  g.beginPath();
  g.arc(x + 21.5 * k, y + 16 * k, 5.5 * k, 0, Math.PI * 2);
  g.strokeStyle = C.amber;
  g.lineWidth = 3 * k;
  g.stroke();
}

export async function drawCertificate(canvas: HTMLCanvasElement, info: CertInfo) {
  try {
    await Promise.all([
      document.fonts.load(`600 80px ${DISPLAY}`),
      document.fonts.load(`400 28px ${SANS}`),
      document.fonts.load(`500 20px ${MONO}`),
    ]);
  } catch {
    /* fall back to system fonts */
  }
  const W = CERT_W;
  const H = CERT_H;
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext("2d");
  if (!g) return;
  g.textBaseline = "alphabetic";

  g.fillStyle = C.bg;
  g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(236,232,223,0.045)";
  g.lineWidth = 1;
  for (let x = 0; x <= W; x += 48) {
    g.beginPath();
    g.moveTo(x + 0.5, 0);
    g.lineTo(x + 0.5, H);
    g.stroke();
  }
  for (let y = 0; y <= H; y += 48) {
    g.beginPath();
    g.moveTo(0, y + 0.5);
    g.lineTo(W, y + 0.5);
    g.stroke();
  }
  const glow = g.createRadialGradient(W / 2, 290, 0, W / 2, 290, 720);
  glow.addColorStop(0, "rgba(255,181,71,0.17)");
  glow.addColorStop(1, "rgba(255,181,71,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);

  roundRect(g, 40, 40, W - 80, H - 80, 28);
  g.strokeStyle = C.amber;
  g.lineWidth = 2.5;
  g.stroke();
  roundRect(g, 56, 56, W - 112, H - 112, 18);
  g.strokeStyle = "rgba(255,181,71,0.22)";
  g.lineWidth = 1;
  g.stroke();

  logo(g, 92, 84, 56);
  g.fillStyle = C.faint;
  g.font = `500 15px ${MONO}`;
  spaced(g, "ERIMSAHOLUT.GITHUB.IO", W - 100, 120, 3, "right");

  g.fillStyle = C.amber;
  g.font = `500 22px ${MONO}`;
  spaced(g, "CERTIFICATE OF CURIOSITY", W / 2, 150, 8, "center");

  // Hexagon badge.
  const bx = W / 2;
  const by = 292;
  const r = 98;
  g.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    g.lineTo(bx + r * Math.cos(a), by + r * Math.sin(a));
  }
  g.closePath();
  const fill = g.createLinearGradient(bx, by - r, bx, by + r);
  fill.addColorStop(0, "#FFD08A");
  fill.addColorStop(1, "#E3962A");
  g.fillStyle = fill;
  g.shadowColor = "rgba(255,181,71,0.55)";
  g.shadowBlur = 40;
  g.fill();
  g.shadowBlur = 0;
  g.strokeStyle = "rgba(15,17,14,0.35)";
  g.lineWidth = 3;
  g.stroke();
  g.fillStyle = C.bg;
  g.textAlign = "center";
  g.font = `700 52px ${DISPLAY}`;
  g.fillText(`${info.total}/${info.total}`, bx, by + 12);
  g.font = `600 15px ${MONO}`;
  spaced(g, "SECRETS", bx, by + 44, 4, "center");

  g.fillStyle = C.muted;
  g.font = `400 28px ${SANS}`;
  g.fillText("This certifies that", W / 2, 470);

  const name = info.name.trim() || "A Curious Visitor";
  let size = 86;
  do {
    g.font = `600 ${size}px ${DISPLAY}`;
    size -= 4;
  } while (g.measureText(name).width > 1180 && size > 36);
  g.fillStyle = C.ink;
  g.fillText(name, W / 2, 566);

  g.fillStyle = C.muted;
  g.font = `400 28px ${SANS}`;
  g.fillText(`found all ${info.total} secrets hidden in Erimsah Olut's portfolio`, W / 2, 630);
  g.fillStyle = C.amber;
  g.font = `600 34px ${DISPLAY}`;
  g.fillText("Certified Secret Hunter — Professional", W / 2, 694);

  g.strokeStyle = "rgba(236,232,223,0.12)";
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(120, 770);
  g.lineTo(W - 120, 770);
  g.stroke();

  const date = new Date(info.last).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  g.textAlign = "left";
  g.fillStyle = C.faint;
  g.font = `500 15px ${MONO}`;
  spaced(g, "ISSUED", 120, 828, 3, "left");
  g.fillStyle = C.ink;
  g.font = `500 26px ${SANS}`;
  g.fillText(date, 120, 866);
  g.fillStyle = C.muted;
  g.font = `400 20px ${SANS}`;
  g.fillText(`Completed in ${duration(info.last - info.first)}`, 120, 900);

  g.textAlign = "center";
  g.fillStyle = C.ink;
  g.font = `600 40px ${DISPLAY}`;
  g.fillText("Erimsah Olut", W / 2, 858);
  g.strokeStyle = "rgba(236,232,223,0.35)";
  g.beginPath();
  g.moveTo(W / 2 - 150, 878);
  g.lineTo(W / 2 + 150, 878);
  g.stroke();
  g.fillStyle = C.faint;
  g.font = `500 14px ${MONO}`;
  spaced(g, "ISSUER", W / 2, 904, 3, "center");

  g.textAlign = "right";
  g.fillStyle = C.faint;
  g.font = `500 15px ${MONO}`;
  spaced(g, "CREDENTIAL ID", W - 120, 828, 3, "right");
  g.fillStyle = C.amber;
  g.font = `500 26px ${MONO}`;
  g.fillText(credentialId(info), W - 120, 866);
  g.fillStyle = C.muted;
  g.font = `400 20px ${SANS}`;
  g.fillText("Verified by sheer curiosity", W - 120, 900);
  g.textAlign = "left";
}
