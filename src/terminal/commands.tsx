import type { ReactNode } from "react";
import { CERTS, CV_FILE, EDUCATION, FEATURED_CERT, LANGUAGES, PROFILE, PROJECTS, SKILLS, cvUrl } from "../data";
import { CLASSIFIED_HINT, GAME_SECRETS, NIGHT_SHIFT_CLEARANCE, SECRETS } from "../secrets/registry";
import { isFound, unlock } from "../secrets/store";
import { taintSpeedrun } from "../secrets/speedrun";
import { runChaos } from "../secrets/chaos";

/* Commands for the hidden terminal. Output is plain React nodes. */

export interface Ctx {
  print: (...lines: ReactNode[]) => void;
  clear: () => void;
  close: () => void;
  openGame: () => void;
  openAdventure: () => void;
  matrix: () => void;
  history: string[];
  startedAt: number;
}

export interface Command {
  desc: string | (() => string);
  hidden?: boolean;
  run: (args: string[], ctx: Ctx) => void | Promise<void>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="text-amber underline underline-offset-2 hover:text-ink">
    {children}
  </a>
);
const K = ({ children }: { children: ReactNode }) => <span className="text-amber">{children}</span>;
const M = ({ children }: { children: ReactNode }) => <span className="text-muted">{children}</span>;
const S = ({ children }: { children: ReactNode }) => <span className="text-sage">{children}</span>;

const LOGO = String.raw`
 ███████  ██████
 ██      ██    ██
 █████   ██    ██
 ██      ██    ██
 ███████  ██████ `;

const COFFEE = String.raw`
      ( (
       ) )
    ........
    |      |]
    \      /
     '----'   brewing...`;

export const FILES: Record<string, string> = {
  "cv.txt": "",
  "skills.json": "",
  "projects.md": "",
  "nightshift.sh": "",
  ".secret": "",
};

/** How many of the site's secrets are found, against what the Night Shift adventure needs. */
export function nightShiftClearance() {
  const have = SECRETS.filter((s) => !GAME_SECRETS.includes(s.id) && isFound(s.id)).length;
  return { have, need: NIGHT_SHIFT_CLEARANCE, ok: have >= NIGHT_SHIFT_CLEARANCE };
}

function cv(): ReactNode[] {
  return [
    <K key="n">{PROFILE.name.toUpperCase()}</K>,
    <span key="r">{PROFILE.role} · {PROFILE.school}</span>,
    <M key="l">{PROFILE.location}</M>,
    "",
    <S key="e">EDUCATION</S>,
    ...EDUCATION.map((e) => `  ${e.years.padEnd(14)} ${e.school} — ${e.degree}`),
    "",
    <S key="c">CERTIFICATIONS</S>,
    `  ★ ${FEATURED_CERT.title} (${FEATURED_CERT.code})`,
    ...CERTS.slice(0, 4).map((c) => `  · ${c.title}`),
    <M key="m">  … and {CERTS.length - 4} more — run "certs"</M>,
    "",
    <S key="s">FOCUS</S>,
    "  Cloud computing · AWS · Backend systems",
    "",
    <span key="d">
      PDF version:{" "}
      <a href={cvUrl()} download={CV_FILE} className="text-amber underline underline-offset-2 hover:text-ink">
        {CV_FILE}
      </a>
    </span>,
    <span key="h">
      Want the full thing? Run <K>projects</K>, <K>skills</K> or <K>sudo hire erimsah</K>.
    </span>,
  ];
}

export const COMMANDS: Record<string, Command> = {
  help: {
    desc: "list available commands",
    run: (_a, { print }) => {
      const rows = Object.entries(COMMANDS).filter(([, c]) => !c.hidden);
      print(
        "Available commands:",
        ...rows.map(([name, c]) => (
          <span key={name}>
            {"  "}
            <K>{name.padEnd(12)}</K>
            <M>{typeof c.desc === "function" ? c.desc() : c.desc}</M>
          </span>
        )),
        "",
        <M key="t">Tip: ↑/↓ for history, Tab to autocomplete, Esc to close.</M>
      );
    },
  },
  whoami: {
    desc: "who is this?",
    run: (_a, { print }) => print(`${PROFILE.name.toLowerCase().replace(" ", "")} — ${PROFILE.role} @ ${PROFILE.school}`, <M key="f">Focus: cloud computing · AWS · backend</M>),
  },
  about: {
    desc: "a short introduction",
    run: (_a, { print }) => print(PROFILE.summary),
  },
  neofetch: {
    desc: "system information",
    run: (_a, { print, startedAt }) => {
      const up = Math.round((performance.now() - startedAt) / 1000);
      const info: [string, string][] = [
        ["OS", "PortfolioOS 1.0 (cloud edition)"],
        ["Host", "erimsaholut.github.io"],
        ["Location", PROFILE.location],
        ["Studying", `Computer Engineering, ${PROFILE.school}`],
        ["Focus", "Cloud · AWS · Backend"],
        ["Certified", `${FEATURED_CERT.title}`],
        ["Languages", LANGUAGES.map((l) => `${l.name} (${l.level})`).join(", ")],
        ["Shell", "erimsah-sh"],
        ["Uptime", `${Math.floor(up / 60)}m ${up % 60}s`],
      ];
      print(
        <div key="nf" className="flex flex-col gap-4 sm:flex-row">
          <pre className="text-amber">{LOGO}</pre>
          <div className="space-y-0.5">
            <p>
              <K>erimsah</K>@<K>torino</K>
            </p>
            <p className="text-faint">-----------------</p>
            {info.map(([k, v]) => (
              <p key={k}>
                <S>{k}</S>: {v}
              </p>
            ))}
            <p className="pt-1">
              {["#FFB547", "#93D3A2", "#8FB0EC", "#ECE8DF", "#FF6FD8", "#272C24"].map((c) => (
                <span key={c} className="mr-1 inline-block h-3 w-5 rounded-sm" style={{ background: c }} />
              ))}
            </p>
          </div>
        </div>
      );
    },
  },
  "cv": {
    desc: "print my CV (same as cat cv.txt)",
    run: (_a, { print }) => print(...cv()),
  },
  projects: {
    desc: "things I've built",
    run: (_a, { print }) =>
      print(
        ...PROJECTS.flatMap((p, i) => [
          <span key={`t${i}`}>
            <K>{String(i + 1).padStart(2, "0")}</K> {p.title} <M>— {p.type}</M>
          </span>,
          <M key={`d${i}`}>{"   "}{p.stack.join(" · ")}</M>,
          ...(p.live ? [<span key={`l${i}`}>{"   "}live: <A href={p.live.url}>{p.live.label}</A></span>] : []),
          ...(p.repo ? [<span key={`r${i}`}>{"   "}code: <A href={p.repo}>{p.repo.replace("https://", "")}</A></span>] : []),
        ]),
        <span key="gh">
          More on <A href={PROFILE.github.url}>{PROFILE.github.label}</A>
        </span>
      ),
  },
  skills: {
    desc: "the toolbox",
    run: (_a, { print }) =>
      print(
        ...SKILLS.map((s) => (
          <span key={s.group}>
            <S>{s.group.padEnd(22)}</S>
            {s.items.join(", ")}
            {s.foundational ? <M> (foundational)</M> : null}
          </span>
        ))
      ),
  },
  education: {
    desc: "where I study",
    run: (_a, { print }) =>
      print(
        ...EDUCATION.flatMap((e) => [
          <span key={e.school}>
            <K>{e.years}</K> {e.school}
          </span>,
          <M key={e.school + "d"}>{"  "}{e.degree} · {e.location}{e.notes.length ? ` · ${e.notes.join(" · ")}` : ""}</M>,
        ])
      ),
  },
  certs: {
    desc: "certifications & courses",
    run: (_a, { print }) =>
      print(
        <span key="f">
          <K>★</K> {FEATURED_CERT.title} <M>({FEATURED_CERT.code})</M>
        </span>,
        ...CERTS.map((c) => (
          <span key={c.title}>
            {"  "}· {c.title} <M>— {c.issuer}</M>
          </span>
        ))
      ),
  },
  contact: {
    desc: "how to reach me",
    run: (_a, { print }) =>
      print(
        <span key="e">
          email    <A href={`mailto:${PROFILE.email}`}>{PROFILE.email}</A>
        </span>,
        <span key="g">
          github   <A href={PROFILE.github.url}>{PROFILE.github.label}</A>
        </span>,
        <span key="l">
          linkedin <A href={PROFILE.linkedin.url}>{PROFILE.linkedin.label}</A>
        </span>
      ),
  },
  ls: {
    desc: "list files",
    run: (args, { print }) => {
      const all = args.some((a) => a.startsWith("-") && a.includes("a"));
      const names = Object.keys(FILES).filter((f) => all || !f.startsWith("."));
      print(<span key="ls">{(all ? [".", "..", ...names] : names).map((n) => <span key={n} className={n.startsWith(".") ? "mr-4 text-muted" : n.endsWith(".sh") ? "mr-4 text-sage" : "mr-4 text-sky"}>{n}</span>)}</span>);
    },
  },
  cat: {
    desc: "print a file (try: cat cv.txt)",
    run: (args, { print }) => {
      const f = args[0];
      if (!f) return print(<M key="u">usage: cat &lt;file&gt; — run "ls" to see files</M>);
      if (f === "cv.txt") return print(...cv());
      if (f === "skills.json") return print(<pre key="j" className="whitespace-pre-wrap">{JSON.stringify(Object.fromEntries(SKILLS.map((s) => [s.group, s.items])), null, 2)}</pre>);
      if (f === "projects.md") return COMMANDS.projects.run([], { print } as Ctx);
      if (f === "nightshift.sh") {
        const { ok, need } = nightShiftClearance();
        return print(
          <M key="1">#!/bin/sh</M>,
          <M key="2"># BUZLIME — night shift runbook</M>,
          <M key="3"># {ok ? "clearance: granted" : `CLASSIFIED — requires clearance level ${need}`}</M>,
          "exec ./nightshift --clock-in",
          "",
          <span key="r">
            Run it with <K>./nightshift.sh</K>
          </span>
        );
      }
      if (f === ".secret") {
        unlock("hidden-file");
        return print(
          <S key="s">🎉 You found the hidden file!</S>,
          "",
          "Everything on this site — the globe, the game, this terminal — is hand-built,",
          "no templates. Thanks for digging this deep.",
          <M key="sig">— Erimsah</M>
        );
      }
      print(<span key="e" className="text-[#FF5A4F]">cat: {f}: No such file or directory</span>);
    },
  },
  aws: {
    desc: "talk to the (pretend) cloud",
    run: (args, { print }) => {
      const cmd = args.join(" ");
      if (cmd.startsWith("s3 ls")) {
        return print(
          <M key="w">⚠ demo mode — these buckets are imaginary</M>,
          "2024-09-01 10:12:44 erimsah-portfolio-assets",
          "2025-02-14 08:03:19 erimsah-coffee-logs",
          "2025-06-30 23:59:01 erimsah-definitely-not-memes",
          "2026-10-19 09:41:07 erimsah-internship-applications"
        );
      }
      if (cmd.startsWith("--version")) return print("aws-cli/2.x erimsah-sh (pretend) — certified: CLF-C02");
      print(<M key="h">Try: aws s3 ls · aws --version</M>);
    },
  },
  ping: {
    desc: "ping a host (try: ping buzlime.com)",
    run: async (args, { print }) => {
      const host = args[0] || "torino";
      print(`PING ${host}: 56 data bytes`);
      for (let i = 0; i < 4; i++) {
        await sleep(380);
        print(`64 bytes from ${host}: icmp_seq=${i} ttl=57 time=${(8 + Math.random() * 18).toFixed(1)} ms`);
      }
      await sleep(200);
      print(<S key="ok">--- {host} ping statistics: 4 packets transmitted, 4 received, 0% packet loss ---</S>);
    },
  },
  sudo: {
    desc: "run as superuser (try: sudo hire erimsah)",
    run: async (args, { print, close }) => {
      const cmd = args.join(" ").toLowerCase();
      if (cmd === "hire erimsah" || cmd === "hire erimsah olut") {
        print(<M key="p">[sudo] password for recruiter:</M>);
        await sleep(700);
        print("••••••••");
        await sleep(500);
        unlock("sudo-hire");
        print(
          <S key="g">✓ Permission granted. Excellent decision.</S>,
          <span key="m">
            Opening contact… or email me directly: <A href={`mailto:${PROFILE.email}`}>{PROFILE.email}</A>
          </span>
        );
        await sleep(1600);
        close();
        taintSpeedrun();
        setTimeout(() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }), 60);
        return;
      }
      if (cmd.startsWith("rm")) return COMMANDS.rm.run(args.slice(1), { print } as Ctx);
      print(<span key="n" className="text-[#FF5A4F]">Nice try. This incident will be reported. 🙂</span>);
    },
  },
  hire: {
    desc: "",
    hidden: true,
    run: (_a, { print }) => print(<span key="d" className="text-[#FF5A4F]">hire: permission denied — try: sudo hire erimsah</span>),
  },
  nightshift: {
    desc: () => (nightShiftClearance().ok ? "📟 a zombie night shift at Buzlime (text adventure)" : "🔒 classified — needs clearance"),
    run: async (_a, { print, openAdventure }) => {
      const { have, need, ok } = nightShiftClearance();
      if (!ok) {
        const left = need - have;
        print(
          <span key="d" className="text-[#FF5A4F]">
            ACCESS DENIED — clearance {have}/{need}
          </span>,
          <M key="m">
            nightshift.sh is classified. Find {left} more secret{left === 1 ? "" : "s"} on this site, then come back.
          </M>,
          <M key="h">Stuck? "secrets" shows the hints.</M>
        );
        return;
      }
      print(
        <S key="g">✓ Clearance granted ({have}/{need}).</S>,
        <span key="p">📟 PAGE · Buzlime warehouse · 02:47 — “Night shift. Something's wrong. Come in.”</span>
      );
      await sleep(1200);
      openAdventure();
    },
  },
  sh: {
    desc: "",
    hidden: true,
    run: (args, ctx) => {
      if (args[0]?.replace(/^\.\//, "") === "nightshift.sh") return COMMANDS.nightshift.run([], ctx);
      ctx.print(<M key="s">You're already in a shell. 🙂 Try ./nightshift.sh</M>);
    },
  },
  play: {
    desc: "launch Region Defender",
    run: async (_a, { print, openGame }) => {
      print(<S key="b">Booting Region Defender…</S>);
      await sleep(500);
      openGame();
    },
  },
  matrix: {
    desc: "wake up, Neo",
    run: (_a, { print, matrix }) => {
      print(<S key="m">Follow the white rabbit…</S>);
      matrix();
    },
  },
  coffee: {
    desc: "refuel",
    run: (_a, { print }) => print(<pre key="c" className="text-amber">{COFFEE}</pre>),
  },
  secrets: {
    desc: "how many easter eggs have you found?",
    run: (_a, { print }) => {
      const n = SECRETS.filter((s) => isFound(s.id)).length;
      print(
        <span key="h">
          Secrets found: <K>{n}/{SECRETS.length}</K>
        </span>,
        ...SECRETS.map((s) =>
          isFound(s.id) ? (
            <span key={s.id}>
              {"  "}<S>✓</S> {s.title}
            </span>
          ) : (
            <M key={s.id}>{"  "}? ??? — {s.classified ? CLASSIFIED_HINT : s.hint}</M>
          )
        )
      );
    },
  },
  date: {
    desc: "current date and time",
    run: (_a, { print }) => print(new Date().toString()),
  },
  echo: {
    desc: "print text",
    run: (args, { print }) => print(args.join(" ")),
  },
  history: {
    desc: "previous commands",
    run: (_a, { print, history }) => print(...(history.length ? history.map((h, i) => `  ${String(i + 1).padStart(3)}  ${h}`) : ["(empty)"])),
  },
  clear: {
    desc: "clear the screen",
    run: (_a, { clear }) => clear(),
  },
  exit: {
    desc: "close the terminal",
    run: (_a, { close }) => close(),
  },
  rm: {
    desc: "",
    hidden: true,
    run: (_a, { print }) => print(<span key="r" className="text-[#FF5A4F]">rm: permission denied — this portfolio is immutable infrastructure 😉</span>),
  },
  cd: {
    desc: "",
    hidden: true,
    run: (_a, { print }) => print(<M key="c">cd: it's a single-page app — there's nowhere else to go 🙂</M>),
  },
  vim: {
    desc: "",
    hidden: true,
    run: (_a, { print }) => print(<M key="v">Relax, you're not stuck. (Hint for real vim: :q!)</M>),
  },
  akhisar: {
    desc: "",
    hidden: true,
    run: async (_a, { print }) => {
      print(<M key="a1">Checking the transmission…</M>);
      await sleep(600);
      const first = unlock("signal");
      print(
        <S key="a2">📡 Signal decoded: AKHISAR</S>,
        <span key="a3">{first ? "Message received loud and clear — Akhisar, Manisa." : "You already cracked this one. 🙂"}</span>
      );
    },
  },
  chaos: {
    desc: "",
    hidden: true,
    run: async (_a, { print, close }) => {
      print(<span key="c1" className="text-[#FF5A4F]">⚠ Starting a chaos experiment in eu-south-1 (Milan)…</span>);
      await sleep(650);
      print(<M key="c2">Closing the terminal — keep your eyes on the page.</M>);
      await sleep(700);
      close();
      setTimeout(() => void runChaos(), 420);
    },
  },
  hello: {
    desc: "",
    hidden: true,
    run: (_a, { print }) => print("Hi there! 👋 Type \"help\" to see what I can do."),
  },
};

export const ALIASES: Record<string, string> = { "./nightshift.sh": "nightshift", "nightshift.sh": "nightshift", bash: "sh", zsh: "sh", hi: "hello", nano: "vim", cls: "clear", quit: "exit", game: "play", "?": "help" };
