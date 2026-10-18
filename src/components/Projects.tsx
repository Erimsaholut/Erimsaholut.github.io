import Section, { Reveal } from "./Section";
import ProjectArt from "./ProjectArt";
import { ArrowUpRight, Code } from "./Icons";
import { PROFILE, PROJECTS } from "../data";

export default function Projects() {
  return (
    <Section id="projects" index="02" label="Projects" title="Things I've built, for clients and for myself.">
      <div className="grid gap-5 md:grid-cols-2">
        {PROJECTS.map((p, i) => (
          <Reveal key={p.title} delay={(i % 2) * 0.08}>
            <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-colors duration-300 hover:border-amber/40">
              <div className="aspect-[16/9] border-b border-line bg-raised">
                <ProjectArt kind={p.art} />
              </div>
              <div className="flex flex-1 flex-col gap-4 p-6 md:p-7">
                <div className="flex items-center justify-between">
                  <span className="eyebrow">{p.type}</span>
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
            </article>
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
