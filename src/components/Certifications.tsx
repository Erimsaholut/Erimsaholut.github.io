import Section, { Reveal } from "./Section";
import { Badge } from "./Icons";
import { CERTS, FEATURED_CERT } from "../data";

export default function Certifications() {
  return (
    <Section id="certifications" index="05" label="Certifications" title="Always learning something.">
      <div className="grid gap-6 md:grid-cols-12">
        <Reveal className="md:col-span-5">
          <div className="relative h-full overflow-hidden rounded-2xl border border-amber/40 bg-gradient-to-br from-amber/15 via-surface to-surface p-7 md:p-8">
            <svg className="absolute -right-10 -top-10 h-48 w-48 text-amber/15" viewBox="0 0 100 100" aria-hidden>
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 6" />
              <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber text-bg">
              <Badge className="w-6 h-6" />
            </span>
            <p className="mt-8 font-mono text-sm text-amber">{FEATURED_CERT.code}</p>
            <h3 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight">{FEATURED_CERT.title}</h3>
            <p className="mt-3 text-muted">{FEATURED_CERT.issuer}</p>
            <div className="mt-8">
              <p className="mb-3 font-mono text-xs uppercase tracking-wider text-faint">Core services covered</p>
              <ul className="flex flex-wrap gap-2">
                {FEATURED_CERT.topics.map((t) => (
                  <li key={t} className="rounded-md border border-amber/30 bg-bg/40 px-2.5 py-1 font-mono text-xs text-amber">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="md:col-span-7">
          <ol className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {CERTS.map((c, i) => (
              <li key={c.title} className="grid grid-cols-[2.25rem,1fr] gap-3 px-5 py-4 md:px-6">
                <span className="font-mono text-xs text-faint pt-1">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="text-[15px] text-ink">{c.title}</p>
                  <p className="mt-0.5 text-sm text-muted">{c.issuer}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </Section>
  );
}
