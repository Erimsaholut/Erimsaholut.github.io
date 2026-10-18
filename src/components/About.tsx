import Section, { Reveal } from "./Section";
import NotebookCard from "./NotebookCard";
import { FACTS, LANGUAGES, PROFILE } from "../data";

export default function About() {
  return (
    <Section id="about" index="01" label="About" title={<>Cloud first, backend close behind — <span className="text-muted">learned by building.</span></>}>
      <div className="grid gap-12 md:grid-cols-12">
        <div className="space-y-10 md:col-span-7">
          <Reveal>
            <p className="text-xl leading-relaxed text-ink/90 md:text-2xl md:leading-[1.55]">{PROFILE.summary}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <NotebookCard />
          </Reveal>
        </div>

        <Reveal delay={0.1} className="md:col-span-5">
          <dl className="divide-y divide-line rounded-2xl border border-line bg-surface md:sticky md:top-24">
            {FACTS.map((f) => (
              <div key={f.k} className="grid grid-cols-[110px,1fr] gap-4 px-5 py-4">
                <dt className="font-mono text-xs uppercase tracking-wider text-faint pt-0.5">{f.k}</dt>
                <dd className="text-sm text-ink">{f.v}</dd>
              </div>
            ))}
            <div className="px-5 py-5">
              <dt className="mb-4 font-mono text-xs uppercase tracking-wider text-faint">Languages</dt>
              <dd className="space-y-3">
                {LANGUAGES.map((l) => (
                  <div key={l.name} className="flex items-baseline justify-between gap-4">
                    <span className="text-sm text-ink">{l.name}</span>
                    <span className="text-sm text-muted">{l.level}</span>
                  </div>
                ))}
              </dd>
            </div>
          </dl>
        </Reveal>
      </div>
    </Section>
  );
}
