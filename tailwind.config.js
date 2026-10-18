/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0F110E",
        surface: "#151813",
        raised: "#1B1F19",
        line: "#272C24",
        ink: "#ECE8DF",
        muted: "#A2A499",
        faint: "#6F7268",
        amber: "#FFB547",
        sage: "#93D3A2",
        sky: "#8FB0EC",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', "system-ui", "sans-serif"],
        sans: ['"Inter Variable"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      keyframes: {
        blink: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0" } },
        ping2: { "0%": { transform: "scale(1)", opacity: "0.7" }, "100%": { transform: "scale(2.6)", opacity: "0" } },
      },
      animation: {
        blink: "blink 1.1s steps(1) infinite",
        ping2: "ping2 1.8s cubic-bezier(0,0,0.2,1) infinite",
      },
    },
  },
  plugins: [],
};
