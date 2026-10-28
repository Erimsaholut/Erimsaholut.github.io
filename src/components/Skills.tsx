import Section, { Reveal } from "./Section";
import SkillSphere from "./SkillSphere";
import { SKILLS } from "../data";

export default function Skills() {
  return (
    <Section id="skills" index="03" label="Skills" title="The toolbox.">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
        <Reveal className="lg:col-span-5">
          <SkillSphere />
          <p className="mt-2 hidden text-center text-xs text-faint [@media(pointer:fine)]:block">
            Move your cursor over the sphere
          </p>
        </Reveal>

        <div className="divide-y divide-line rounded-2xl border border-line bg-surface px-6 lg:col-span-7">
          {SKILLS.map((s, i) => (
            <Reveal key={s.group} delay={i * 0.05} className="grid gap-4 py-6 md:grid-cols-12 md:items-center">
              <div className="md:col-span-4">
                <h3 className="text-sm font-semibold text-ink">{s.group}</h3>
                {s.note && <p className="mt-2 text-xs text-muted">{s.note}</p>}
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
      </div>
    </Section>
  );
}
