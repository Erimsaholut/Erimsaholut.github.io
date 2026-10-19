/** Shown while the game chunk downloads. */
export default function GameBoot({ label = "Booting defense grid…" }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07080A]" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-amber" />
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">{label}</p>
      </div>
    </div>
  );
}
