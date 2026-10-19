import Logo from "./Logo";
import { SecretsBadge } from "../secrets/SecretsUI";
import { PROFILE } from "../data";

export default function Footer({ onSecrets }: { onSecrets: () => void }) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-faint md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-center gap-2.5 text-ink">
          <Logo className="w-6 h-6" />
          <span className="text-faint">© {new Date().getFullYear()} {PROFILE.name}</span>
        </div>
        <SecretsBadge onOpen={onSecrets} />
        <a href="#top" className="hover:text-ink transition-colors">Back to top ↑</a>
      </div>
    </footer>
  );
}
