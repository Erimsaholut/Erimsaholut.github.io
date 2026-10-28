/*
 * Builds two static files from src/data.ts with headless Chrome:
 *   public/<CV_FILE>  — the downloadable CV (A4 PDF, selectable text, clickable links)
 *   public/og.png     — the 1200×630 preview image LinkedIn & co. show for the site's link
 *
 * Run `npm run assets` after changing the site's content. Set CHROME=/path/to/chrome if
 * Chrome isn't installed in the default macOS location.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { CERTS, CV_FILE, CV_SUMMARY, EDUCATION, FEATURED_CERT, LANGUAGES, PROFILE, PROJECTS, SITE_URL, SKILLS } from "../src/data.ts";
import { SECRETS } from "../src/secrets/registry.ts";

const ROOT = resolve(import.meta.dirname, "..");
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const font = (pkg: string, file: string) => pathToFileURL(join(ROOT, "node_modules", pkg, "files", file)).href;

const FONTS = `
@font-face { font-family: "Geist"; font-weight: 100 900; src: url("${font("@fontsource-variable/geist", "geist-latin-wght-normal.woff2")}") format("woff2"); }
@font-face { font-family: "Geist Mono"; font-weight: 100 900; src: url("${font("@fontsource-variable/geist-mono", "geist-mono-latin-wght-normal.woff2")}") format("woff2"); }`;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const host = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "");
/** The site talks in first person; a CV doesn't. */
const cvVoice = (s: string) => s.replace(/\bI implemented\b/g, "Implemented").replace(/\bI built\b/g, "Built");

// ---------------------------------------------------------------------------------------------
// CV

function cvHtml() {
  const contact = [
    `<a href="mailto:${PROFILE.email}">${PROFILE.email}</a>`,
    `<a href="${PROFILE.linkedin.url}">${PROFILE.linkedin.label}</a>`,
    `<a href="${PROFILE.github.url}">${PROFILE.github.label}</a>`,
    `<a href="${SITE_URL}">${host(SITE_URL)}</a>`,
    esc(PROFILE.location),
  ].join(`<span class="dot">·</span>`);

  const education = EDUCATION.map(
    (e) => `
    <div class="entry">
      <div class="row"><span><strong>${esc(e.school)}</strong> — ${esc(e.degree)} <span class="muted">· ${esc(e.location)}</span></span><span class="right">${esc(e.years.replace("—", "–"))}</span></div>
      <ul>
        ${e.notes.map((n) => `<li>${esc(n)}</li>`).join("")}
        <li>Relevant coursework: ${esc(e.coursework.join(", "))}</li>
      </ul>
    </div>`
  ).join("");

  const projects = PROJECTS.map((p) => {
    const link = p.live ? `<a href="${p.live.url}">${esc(p.live.label)}</a>` : p.repo ? `<a href="${p.repo}">${esc(host(p.repo))}</a>` : "";
    return `
    <div class="entry">
      <div class="row"><span><strong>${esc(p.title)}</strong> <span class="muted">· ${esc(p.type)}</span></span><span class="right stack">${esc(p.stack.join(" · "))}</span></div>
      <p>${esc(cvVoice(p.description))}${p.highlights.length ? ` ${esc(p.highlights.join("; "))}.` : ""}${link ? ` ${link}` : ""}</p>
    </div>`;
  }).join("");

  const skills = SKILLS.map(
    (s) => `<tr><th>${esc(s.group)}</th><td>${esc(s.items.join(", "))}${s.foundational ? ` <span class="muted">— ${esc(s.note ?? "foundational")}</span>` : ""}</td></tr>`
  ).join("");

  const certs = CERTS.map((c) => `<span>${esc(c.title)} <span class="muted">(${esc(c.issuer.replace(" · ", ", "))})</span></span>`).join(`<span class="dot">·</span>`);

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(PROFILE.name)} — CV</title><style>
${FONTS}
@page { size: A4; margin: 12mm 15mm 11mm; }
* { box-sizing: border-box; }
body { margin: 0; font: 400 9.2pt/1.38 "Geist", system-ui, sans-serif; color: #1d1f1b; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
a { color: inherit; text-decoration: none; border-bottom: 0.5pt solid #c9a46a; }
h1 { margin: 0; font: 600 27pt/1 "Geist", sans-serif; letter-spacing: -0.02em; }
h1 span { color: #B26A00; }
.role { margin: 4pt 0 0; font-size: 11pt; color: #3d4039; }
.contact { margin: 7pt 0 0; font-size: 8.8pt; color: #3d4039; }
.dot { margin: 0 5pt; color: #b9b3a6; }
header { padding-bottom: 9pt; border-bottom: 1.4pt solid #1d1f1b; }
h2 { margin: 10pt 0 4pt; font: 600 8.4pt/1 "Geist", sans-serif; letter-spacing: 0.06em; text-transform: uppercase; color: #B26A00; display: flex; align-items: center; gap: 8pt; }
h2::after { content: ""; flex: 1; height: 0.6pt; background: #e2dccf; }
p { margin: 0; }
.entry { margin-bottom: 5pt; break-inside: avoid; }
.row { display: flex; gap: 6pt; align-items: baseline; }
.right { margin-left: auto; white-space: nowrap; font-size: 8.6pt; color: #5d6058; }
.stack { font-size: 8.2pt; }
.muted { color: #6a6d64; }
ul { margin: 2pt 0 0; padding-left: 12pt; }
li { margin: 0.6pt 0; }
.featured { margin-bottom: 3pt; }
.featured strong { color: #1d1f1b; }
.certs { font-size: 8.7pt; line-height: 1.5; }
.certs .dot { margin: 0 4pt; }
table { border-collapse: collapse; width: 100%; }
th { width: 31%; padding: 1.4pt 10pt 1.4pt 0; text-align: left; font-weight: 600; vertical-align: top; }
td { padding: 1.4pt 0; }
footer { margin-top: 10pt; padding-top: 5pt; border-top: 0.6pt solid #e2dccf; font-size: 8.2pt; color: #6a6d64; }
</style></head><body>
<header>
  <h1>Erimsah <span>Olut</span></h1>
  <p class="role">BSc Computer Engineering Student · ${esc(PROFILE.school)}</p>
  <p class="contact">${contact}</p>
</header>

<h2>Profile</h2>
<p>${esc(CV_SUMMARY)}</p>

<h2>Education</h2>
${education}

<h2>Certifications &amp; courses</h2>
<p class="featured"><strong>${esc(FEATURED_CERT.title)}</strong> <span class="muted">(${esc(FEATURED_CERT.code)}, ${esc(FEATURED_CERT.issuer)})</span></p>
<p class="certs">${certs}</p>

<h2>Projects</h2>
${projects}

<h2>Technical skills</h2>
<table>${skills}</table>

<h2>Languages</h2>
<p>${LANGUAGES.map((l) => `<strong>${esc(l.name)}</strong> ${esc(l.level.replace("—", "–"))}`).join(`<span class="dot">·</span>`)}</p>

<footer>Interactive portfolio, projects and more: <a href="${SITE_URL}">${host(SITE_URL)}</a></footer>
</body></html>`;
}

// ---------------------------------------------------------------------------------------------
// Link preview image

function globeSvg(cx: number, cy: number, r: number) {
  const tilt = (40 * Math.PI) / 180; // tip the sphere so Europe faces the viewer
  const spin = (-16 * Math.PI) / 180;
  const project = (lat: number, lon: number) => {
    const la = (lat * Math.PI) / 180;
    const lo = (lon * Math.PI) / 180 + spin;
    let x = Math.cos(la) * Math.sin(lo);
    let y = Math.sin(la);
    let z = Math.cos(la) * Math.cos(lo);
    [y, z] = [y * Math.cos(tilt) - z * Math.sin(tilt), y * Math.sin(tilt) + z * Math.cos(tilt)];
    return { x: cx + x * r, y: cy - y * r, z };
  };
  const dots: string[] = [];
  const N = 1100;
  for (let i = 0; i < N; i++) {
    const lat = (Math.asin(1 - (2 * (i + 0.5)) / N) * 180) / Math.PI;
    const lon = (i * 137.508) % 360;
    const p = project(lat, lon);
    if (p.z < 0.02) continue;
    dots.push(`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(1.1 + 1.5 * p.z).toFixed(2)}" fill="#ECE8DF" opacity="${(0.12 + 0.55 * p.z).toFixed(2)}"/>`);
  }
  const hubs = [
    [45.07, 7.69],
    [38.61, 27.43],
    [41.01, 28.98],
    [52.52, 13.4],
    [48.86, 2.35],
    [51.51, -0.13],
    [40.42, -3.7],
    [59.33, 18.07],
  ].map(([la, lo]) => project(la, lo));
  const arc = (a: { x: number; y: number }, b: { x: number; y: number }, lift: number) => {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 - lift;
    return `<path d="M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}" fill="none" stroke="#FFB547" stroke-width="2.2" stroke-linecap="round" opacity="0.9"/>`;
  };
  const arcs = [arc(hubs[0], hubs[1], 70), arc(hubs[0], hubs[3], 50), arc(hubs[0], hubs[5], 60), arc(hubs[1], hubs[2], 26), arc(hubs[4], hubs[6], 40)];
  const hubDots = hubs.map(
    (h, i) =>
      `<circle cx="${h.x.toFixed(1)}" cy="${h.y.toFixed(1)}" r="${i < 2 ? 14 : 9}" fill="#FFB547" opacity="0.18"/><circle cx="${h.x.toFixed(1)}" cy="${h.y.toFixed(1)}" r="${i < 2 ? 5.5 : 3.6}" fill="${i < 2 ? "#FFB547" : "#93D3A2"}"/>`
  );
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0">
    <defs><radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFB547" stop-opacity="0.22"/><stop offset="1" stop-color="#FFB547" stop-opacity="0"/></radialGradient></defs>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="#121510"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${r * 1.2}" ry="${r * 0.26}" fill="none" stroke="#FFB547" stroke-opacity="0.28" stroke-width="1.5" transform="rotate(-16 ${cx} ${cy})"/>
    ${dots.join("")}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ECE8DF" stroke-opacity="0.16" stroke-width="1.5"/>
    ${arcs.join("")}${hubDots.join("")}
  </svg>`;
}

function ogHtml() {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS}
html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #131209; }
body { position: relative; font-family: "Geist", sans-serif; color: #ECE8DF; }
.grid { position: absolute; inset: 0; background-image: linear-gradient(to right, rgba(236,232,223,.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(236,232,223,.05) 1px, transparent 1px); background-size: 48px 48px; }
.copy { position: absolute; left: 72px; top: 58px; width: 660px; }
.logo { display: flex; align-items: center; gap: 12px; font: 600 22px "Geist"; }
.eyebrow { margin-top: 46px; font: 500 17px "Geist", sans-serif; letter-spacing: .2em; color: #FFB547; }
h1 { margin: 14px 0 0; font: 600 104px/1 "Geist", sans-serif; letter-spacing: -0.035em; }
h1 span { display: block; width: fit-content; background: linear-gradient(90deg, #FFFFFF, #9B9B9B); -webkit-background-clip: text; background-clip: text; color: transparent; padding-bottom: 8px; }
.sub { margin-top: 24px; font-size: 24px; line-height: 1.35; color: #A2A499; }
.chips { margin-top: 22px; display: flex; gap: 10px; }
.chip { padding: 8px 14px; border: 1px solid #313131; border-radius: 12px; background: #181818; font-size: 19px; color: #ECE8DF; }
.foot { position: absolute; left: 72px; right: 72px; bottom: 44px; display: flex; justify-content: space-between; font: 500 17px "Geist Mono", monospace; color: #6F7268; }
.foot b { font-weight: 500; color: #FFB547; }
</style></head><body>
${globeSvg(955, 300, 222)}
<div class="copy">
  <div class="logo">
    <svg viewBox="0 0 32 32" width="40" height="40"><g fill="#ECE8DF"><rect x="5" y="9" width="3" height="14" rx="1"/><rect x="5" y="9" width="9" height="3" rx="1"/><rect x="5" y="14.5" width="7" height="3" rx="1"/><rect x="5" y="20" width="9" height="3" rx="1"/></g><circle cx="21.5" cy="16" r="5.5" fill="none" stroke="#FFB547" stroke-width="3"/></svg>
  </div>
  <div class="eyebrow">PORTFOLIO · ${esc(PROFILE.location.toUpperCase())}</div>
  <h1><span>Erimsah</span><span>Olut</span></h1>
  <div class="sub">Computer Engineering student at ${esc(PROFILE.school)}</div>
  <div class="chips"><span class="chip">Cloud computing</span><span class="chip">AWS</span><span class="chip">Backend</span></div>
</div>
<div class="foot"><span>${host(SITE_URL)}</span><b>◆ ${SECRETS.length} secrets hidden inside</b></div>
</body></html>`;
}

// ---------------------------------------------------------------------------------------------

if (!existsSync(CHROME)) {
  console.error(`Chrome not found at ${CHROME}. Set CHROME=/path/to/chrome and run again.`);
  process.exit(1);
}
const tmp = mkdtempSync(join(tmpdir(), "eo-assets-"));
const chrome = (...args: string[]) =>
  execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `--user-data-dir=${join(tmp, "profile")}`, "--virtual-time-budget=4000", ...args], {
    stdio: "pipe",
  });

try {
  const cvPage = join(tmp, "cv.html");
  writeFileSync(cvPage, cvHtml());
  chrome("--no-pdf-header-footer", `--print-to-pdf=${join(ROOT, "public", CV_FILE)}`, pathToFileURL(cvPage).href);
  console.log(`✓ public/${CV_FILE}`);

  const ogPage = join(tmp, "og.html");
  writeFileSync(ogPage, ogHtml());
  chrome("--hide-scrollbars", "--force-device-scale-factor=1", "--window-size=1200,630", `--screenshot=${join(ROOT, "public", "og.png")}`, pathToFileURL(ogPage).href);
  console.log("✓ public/og.png");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
