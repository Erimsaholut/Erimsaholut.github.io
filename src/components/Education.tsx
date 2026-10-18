import Section, { Reveal } from "./Section";
import { Pin } from "./Icons";
import { EDUCATION } from "../data";

export default function Education() {
  return (
    <Section id="education" index="05" label="Education" title="Two universities, two countries.">
      <ol className="relative space-y-6 md:pl-10">
        <span className="absolute left-[11px] top-3 bottom-3 hidden w-px bg-line md:block" aria-hidden />
        {EDUCATION.map((e, i) => (
          <Reveal key={e.school} delay={i * 0.1}>
            <li className="relative rounded-2xl border border-line bg-surface p-6 md:p-8">
              <span
                className={`absolute -left-[37px] top-9 hidden h-[15px] w-[15px] rounded-full border-2 md:block ${
                  e.current ? "border-amber bg-amber/30" : "border-line bg-bg"
                }`}
                aria-hidden
              />
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-sm text-amber">{e.years}</span>
                {e.current && (
                  <span className="rounded-full bg-amber/15 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-amber">
                    Current
                  </span>
                )}
              </div>
              <h3 className="mt-3 font-display text-3xl font-semibold tracking-tight">{e.school}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-muted">
                <span>{e.degree}</span>
                <span className="inline-flex items-center gap-1.5 text-sm">
                  <Pin className="w-3.5 h-3.5" />
                  {e.location}
                </span>
              </div>
              {e.notes.length > 0 && (
                <ul className="mt-5 space-y-1.5">
                  {e.notes.map((n) => (
                    <li key={n} className="flex gap-3 text-sm text-ink/90">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-sm bg-sage" />
                      {n}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-6">
                <p className="mb-3 font-mono text-xs uppercase tracking-wider text-faint">Relevant coursework</p>
                <ul className="flex flex-wrap gap-2">
                  {e.coursework.map((c) => (
                    <li key={c} className="chip">{c}</li>
                  ))}
                </ul>
              </div>
            </li>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
