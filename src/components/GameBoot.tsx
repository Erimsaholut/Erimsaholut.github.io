/** Skeleton shown while a game chunk downloads, shaped like the screen that's about to appear. */
export default function GameBoot({ label = "Loading Region Defender", variant = "game" }: { label?: string; variant?: "game" | "story" }) {
  const block = "rounded-full bg-raised animate-skeleton";
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-6" aria-hidden>
        <span className={`${block} h-4 w-32`} />
        <span className={`${block} ml-auto h-4 w-12`} />
        <span className={`${block} h-4 w-16`} />
      </div>
      {variant === "game" ? (
        <div className="relative flex flex-1 items-center justify-center p-6" aria-hidden>
          <span className="aspect-square w-[min(70vw,60vh)] rounded-full border border-line bg-surface animate-skeleton" />
          <div className="absolute inset-x-0 bottom-6 flex justify-center gap-3">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="h-12 w-12 rounded-2xl bg-raised animate-skeleton" />
            ))}
          </div>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4 px-4 sm:px-6" aria-hidden>
          <span className={`${block} h-4 w-40`} />
          <span className="h-16 w-3/4 rounded-2xl bg-raised animate-skeleton" />
          <span className={`${block} mt-4 h-4 w-full`} />
          <span className={`${block} h-4 w-5/6`} />
          <span className={`${block} h-4 w-2/3`} />
        </div>
      )}
    </div>
  );
}
