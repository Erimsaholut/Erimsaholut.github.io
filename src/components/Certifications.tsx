import { lazy, Suspense, useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import Section, { Reveal } from "./Section";
import { Badge } from "./Icons";
import { CERTS, FEATURED_CERT } from "../data";
import SafeBoundary from "../three/SafeBoundary";
import { hasWebGL } from "../three/input";

const CertCoin = lazy(() => import("../three/CertCoin"));

function BadgeFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber text-bg">
        <Badge className="w-10 h-10" />
      </span>
    </div>
  );
}

export default function Certifications() {
  const reduce = !!useReducedMotion();
  const webgl = useMemo(() => hasWebGL(), []);

  return (
    <Section id="certifications" index="04" label="Certifications" title="Always learning something.">
      <div className="grid gap-6 md:grid-cols-12">
        <Reveal className="md:col-span-5">
          <div className="relative h-full overflow-hidden rounded-2xl border border-amber/40 bg-gradient-to-br from-amber/15 via-surface to-surface p-7 md:p-8">
            <div className="pointer-events-none absolute left-1/2 top-24 h-56 w-56 -translate-x-1/2 rounded-full bg-amber/20 blur-3xl" aria-hidden />
            <div className="relative -mx-4 -mt-4 h-60 md:h-64" aria-hidden>
              {webgl ? (
                <SafeBoundary fallback={<BadgeFallback />}>
                  <Suspense fallback={<BadgeFallback />}>
                    <CertCoin reduce={reduce} />
                  </Suspense>
                </SafeBoundary>
              ) : (
                <BadgeFallback />
              )}
            </div>
            <p className="relative mt-4 font-mono text-sm text-amber">{FEATURED_CERT.code}</p>
            <h3 className="relative mt-2 font-display text-3xl font-semibold leading-tight tracking-tight">{FEATURED_CERT.title}</h3>
            <p className="relative mt-3 text-muted">{FEATURED_CERT.issuer}</p>
            <div className="relative mt-8">
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
              <li key={c.title} className="grid grid-cols-[2.25rem,1fr] gap-3 px-5 py-4 transition-colors hover:bg-raised md:px-6">
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
