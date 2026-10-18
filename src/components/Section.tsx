import { motion } from "framer-motion";
import type { ReactNode } from "react";

export const EASE = [0.22, 1, 0.36, 1] as const;

export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.75, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

interface Props {
  id: string;
  index: string;
  label: string;
  title: ReactNode;
  children: ReactNode;
}

export default function Section({ id, index, label, title, children }: Props) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-line py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Reveal className="mb-12 md:mb-16 grid gap-4 md:grid-cols-12 md:items-end">
          <p className="eyebrow md:col-span-4">
            <span className="text-faint">{index}</span> / {label}
          </p>
          <h2 className="md:col-span-8 font-display text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">{title}</h2>
        </Reveal>
        {children}
      </div>
    </section>
  );
}
