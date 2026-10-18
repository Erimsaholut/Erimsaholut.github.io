import Section, { Reveal } from "./Section";
import ProjectArt from "./ProjectArt";
import { ArrowUpRight, Code } from "./Icons";
import { TiltCard } from "./Effects";
import { PROFILE, PROJECTS } from "../data";

export default function Projects() {
  return (
    <Section id="projects" index="02" label="Projects" title="Things I've built, for clients and for myself.">
      <div className="grid gap-5 md:grid-cols-2">
        {PROJECTS.map((p, i) => (
          <Reveal key={p.title} delay={(i % 2) * 0.08} className="md:h-full">
            <TiltCard>
            <article className="group isolate flex flex-col md:h-full overflow-hidden rounded-2xl border border-line bg-surface transition-colors duration-300 [@media(hover:hover)]:hover:border-amber/40">
              <div className="relative w-full shrink-0 overflow-hidden border-b border-line bg-raised pt-[56.25%]">
                <div className="absolute inset-0">
                  <ProjectArt kind={p.art} />
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-4 p-6 md:p-7">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="eyebrow">{p.type}</span>
                    {p.live && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-sage/30 bg-sage/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-sage">
                        <span className="h-1.5 w-1.5 rounded-full bg-sage animate-pulse" /> Live
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-xs text-faint">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="font-display text-2xl font-semibold tracking-tight">{p.title}</h3>
                <p className="text-[15px] leading-relaxed text-muted">{p.description}</p>
                <ul className="space-y-1.5">
                  {p.highlights.map((h) => (
                    <li key={h} className="flex gap-3 text-sm text-ink/85">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-sm bg-amber" />
                      {h}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap gap-2">
                    {p.stack.map((t) => (
                      <span key={t} className="rounded border border-line px-2 py-1 font-mono text-[11px] text-muted">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    {p.live && (
                      <a
                        href={p.live.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md bg-amber px-3 py-1.5 text-sm font-semibold text-bg transition hover:bg-amber/90"
                      >
                        Visit {p.live.label} <ArrowUpRight className="w-4 h-4" />
                      </a>
                    )}
                    {p.repo && (
                      <a
                        href={p.repo}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-amber"
                      >
                        View code <ArrowUpRight className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </article>
            </TiltCard>
          </Reveal>
        ))}

        <Reveal className="md:col-span-2">
          <a
            href={PROFILE.github.url}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col gap-5 rounded-2xl border border-dashed border-line p-6 transition-colors hover:border-amber/50 md:flex-row md:items-center md:justify-between md:p-7"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-amber">
                <Code className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold">Additional work</h3>
                <p className="mt-1 text-sm text-muted">
                  Smaller projects and coding exercises in Python, Java and C covering core programming concepts.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-ink group-hover:text-amber">
              Browse on GitHub
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </a>
        </Reveal>
      </div>
    </Section>
  );
}
