import Section, { Reveal } from "./Section";
import { SKILLS } from "../data";

export default function Skills() {
  return (
    <Section id="skills" index="03" label="Skills" title="The toolbox.">
      <div className="divide-y divide-line border-y border-line">
        {SKILLS.map((s, i) => (
          <Reveal key={s.group} delay={i * 0.05} className="grid gap-4 py-6 md:grid-cols-12 md:items-center">
            <div className="md:col-span-4">
              <h3 className="font-mono text-xs uppercase tracking-wider text-faint">{s.group}</h3>
              {s.note && <p className="mt-1.5 text-xs text-muted">{s.note}</p>}
            </div>
            <ul className="flex flex-wrap gap-2 md:col-span-8">
              {s.items.map((item) => (
                <li key={item} className={s.foundational ? "chip border-dashed bg-transparent text-ink/80" : "chip"}>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
