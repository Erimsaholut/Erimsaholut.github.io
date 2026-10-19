// Hand-drawn line icons (24×24, stroke = currentColor).
import type { ReactNode } from "react";

function Icon({ children, className = "w-4 h-4" }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {children}
    </svg>
  );
}

type P = { className?: string };

export const ArrowUpRight = (p: P) => <Icon {...p}><path d="M7 17 17 7M8.5 7H17v8.5" /></Icon>;
export const ArrowDown = (p: P) => <Icon {...p}><path d="M12 5v14M6.5 13.5 12 19l5.5-5.5" /></Icon>;
export const Mail = (p: P) => <Icon {...p}><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="m3.5 7.5 8.5 6 8.5-6" /></Icon>;
export const Pin = (p: P) => <Icon {...p}><path d="M12 21s-6.5-5.8-6.5-10.8a6.5 6.5 0 0 1 13 0C18.5 15.2 12 21 12 21Z" /><circle cx="12" cy="10.2" r="2.3" /></Icon>;
export const Copy = (p: P) => <Icon {...p}><rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2.5" /><path d="M15.5 8.5V6A2 2 0 0 0 13.5 4H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5" /></Icon>;
export const Check = (p: P) => <Icon {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Icon>;
export const Menu = (p: P) => <Icon {...p}><path d="M4 7h16M4 12h16M4 17h10" /></Icon>;
export const Close = (p: P) => <Icon {...p}><path d="M6 6l12 12M18 6 6 18" /></Icon>;
export const Code = (p: P) => <Icon {...p}><path d="m8.5 8-4 4 4 4M15.5 8l4 4-4 4M13.5 5.5l-3 13" /></Icon>;
export const Person = (p: P) => <Icon {...p}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 19.5c1.2-3.2 3.8-5 7-5s5.8 1.8 7 5" /></Icon>;
export const Download = (p: P) => <Icon {...p}><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14" /></Icon>;
export const Badge = (p: P) => <Icon {...p}><circle cx="12" cy="9.5" r="5.5" /><path d="m9 14.3-1.5 6.2L12 18l4.5 2.5-1.5-6.2" /></Icon>;
