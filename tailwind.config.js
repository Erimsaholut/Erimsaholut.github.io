/** @type {import('tailwindcss').Config} */

// Design rules: one typeface (Geist; Geist Mono only for code and terminal UI), flat dark surfaces
// from a fixed palette, and one easing curve that decelerates into place.
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export default {
  content: ["./*.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#131209",
        surface: "#181818",
        raised: "#1F1F1F",
        line: "#313131",
        ink: "#ECE8DF",
        muted: "#A2A499",
        faint: "#7A7C72",
        amber: "#FFB547",
        sage: "#93D3A2",
        sky: "#8FB0EC",
      },
      fontFamily: {
        display: ['"Geist Variable"', "system-ui", "sans-serif"],
        sans: ['"Geist Variable"', "system-ui", "sans-serif"],
        mono: ['"Geist Mono Variable"', "ui-monospace", "monospace"],
      },
      transitionTimingFunction: { DEFAULT: EASE, base: EASE },
      transitionDuration: { DEFAULT: "300ms" },
      keyframes: {
        blink: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0" } },
        ping2: { "0%": { transform: "scale(1)", opacity: "0.7" }, "100%": { transform: "scale(2.6)", opacity: "0" } },
        ripple: { "0%": { transform: "translate(-50%,-50%) scale(0.3)", opacity: "1" }, "100%": { transform: "translate(-50%,-50%) scale(1.7)", opacity: "0" } },
        pop: { "0%": { transform: "scale(1)" }, "40%": { transform: "scale(1.35) rotate(-8deg)" }, "100%": { transform: "scale(1)" } },
        alarm: { "0%,100%": { opacity: "0.45" }, "50%": { opacity: "1" } },
        skeleton: { "0%,100%": { opacity: "0.45" }, "50%": { opacity: "0.9" } },
      },
      animation: {
        blink: "blink 1.1s steps(1) infinite",
        ping2: `ping2 1.8s ${EASE} infinite`,
        ripple: `ripple 0.5s ${EASE} forwards`,
        pop: `pop 0.35s ${EASE}`,
        alarm: `alarm 3.2s ${EASE} infinite`,
        skeleton: `skeleton 1.6s ${EASE} infinite`,
      },
    },
  },
  plugins: [],
};
