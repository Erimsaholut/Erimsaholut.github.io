import Logo from "./Logo";
import { SecretsBadge } from "../secrets/SecretsUI";
import Signal from "../secrets/Signal";
import { PROFILE } from "../data";

export default function Footer({ onSecrets }: { onSecrets: () => void }) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-faint md:flex-row md:items-center md:justify-between md:px-8">
        {/* relative: on phones the signal popover lines up with this row instead of the small light */}
        <div className="relative flex items-center gap-3 text-ink">
          <Logo className="w-6 h-6" />
          <span className="text-faint">© {new Date().getFullYear()} {PROFILE.name}</span>
          <Signal />
        </div>
        <SecretsBadge onOpen={onSecrets} />
        <nav className="flex flex-wrap items-center gap-4" aria-label="Footer">
          <a href="/privacy.html#privacy" className="rounded-md transition-colors hover:text-ink">
            Privacy
          </a>
          <a href="/privacy.html#terms" className="rounded-md transition-colors hover:text-ink">
            Terms
          </a>
          <a href="#top" className="rounded-md transition-colors hover:text-ink">
            Back to top ↑
          </a>
        </nav>
      </div>
    </footer>
  );
}
