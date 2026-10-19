/*
 * Every easter egg on the site. To add a new one:
 *   1. add an entry here (the id is what you pass to `unlock`), and
 *   2. call `unlock("<id>")` from src/secrets/store.ts where it's triggered.
 * The footer counter, the secrets panel and the "secret found" toast pick it up automatically.
 */
export interface SecretDef {
  id: string;
  title: string;
  /** Shown while still locked. */
  hint: string;
  /** Shown once found. */
  found: string;
  /** No hint at all while locked — you have to stumble on it (or follow another secret). */
  classified?: boolean;
}

export const CLASSIFIED_HINT = "Classified. No hints for this one — keep your eyes open.";

export const SECRETS: SecretDef[] = [
  {
    id: "last-letter",
    title: "The last letter",
    hint: "The last letter of my name hides something. Tap it three times.",
    found: "Opened Region Defender from the title.",
  },
  {
    id: "wave-5",
    title: "Network engineer",
    hint: "Keep the network online until wave 5.",
    found: "Reached wave 5 in Region Defender.",
  },
  {
    id: "terminal",
    title: "Root access",
    hint: "Tap my name in the top bar five times, quickly.",
    found: "Opened the hidden terminal.",
  },
  {
    id: "explorer",
    title: "Power user",
    hint: "Get comfortable in the terminal: run 8 different commands.",
    found: "Ran 8 different terminal commands.",
  },
  {
    id: "hidden-file",
    title: "Dotfile detective",
    hint: "Some files only show up with the right flag.",
    found: "Found and read the hidden file.",
  },
  {
    id: "sudo-hire",
    title: "Permission granted",
    hint: "There's one command every recruiter should run.",
    found: "Ran sudo hire erimsah.",
  },
  {
    id: "night-owl",
    title: "Night owl",
    hint: "Some things only show up late at night.",
    found: "Visited between midnight and 5 a.m.",
  },
  {
    id: "speedrunner",
    title: "Speedrunner",
    hint: "Get from the top of the page to the very bottom — fast.",
    found: "Scrolled the whole page in a few seconds.",
  },
  {
    id: "chaos",
    title: "Chaos engineer",
    hint: "Break the site on purpose: shake your phone, or ask the terminal for some chaos.",
    found: "Broke the page on purpose and watched it heal itself.",
  },
  {
    id: "invisible-ink",
    title: "Invisible ink",
    hint: "Some words here are written in invisible ink. Highlight them to read.",
    found: "Found the hidden message by selecting it.",
  },
  {
    id: "signal",
    title: "Signal",
    hint: "",
    found: "Decoded the Morse signal in the footer.",
    classified: true,
  },
  {
    id: "night-shift",
    title: "Night shift",
    hint: "One file in the terminal needs clearance. Find five secrets first.",
    found: "Clocked in for the night shift at Buzlime.",
  },
  {
    id: "best-ending",
    title: "Fleet commander",
    hint: "Survive the night shift — and bring everyone home.",
    found: "Reached the best ending of Night Shift.",
  },
  {
    id: "patient-zero",
    title: "Patient Zero",
    hint: "Some tapes are only worth rewinding after you've seen a few endings.",
    found: "Found the secret ending of Night Shift.",
  },
];

/** Secrets needed before the Night Shift adventure opens (the game's own two don't count). */
export const NIGHT_SHIFT_CLEARANCE = 5;
export const GAME_SECRETS = ["night-shift", "best-ending", "patient-zero"];
