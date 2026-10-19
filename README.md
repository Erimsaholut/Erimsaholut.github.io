# Erimsah Olut — Portfolio

Live at **https://erimsaholut.github.io**

Personal portfolio site, built with React, TypeScript, Vite, Tailwind CSS, Framer Motion and Three.js (React Three Fiber).

All graphics and 3D models are generated in code (SVG, canvas and WebGL) — no external images, models or textures. Fonts are self-hosted from Fontsource (SIL Open Font License).

## Develop

```bash
npm install
npm run dev
```

Site content lives in `src/data.ts`.

## Deploy

Every push to `main` builds the site and publishes it to GitHub Pages via `.github/workflows/deploy.yml`.

## CV and link preview

`public/Erimsah-Olut-CV.pdf` (the "Download CV" file) and `public/og.png` (the image LinkedIn and
other apps show for the site's link) are generated from `src/data.ts`. After editing the content, run

```bash
npm run assets
```

It uses headless Chrome; set `CHROME=/path/to/chrome` if it isn't in the default macOS location.

## Easter eggs

Secrets are listed in `src/secrets/registry.ts`. To add one, add an entry there and call
`unlock("<id>")` (from `src/secrets/store.ts`) where it's triggered — the footer counter, the
secrets panel and the "secret found" toast update automatically. Progress is stored in the
visitor's browser only.

Finding every secret unlocks a downloadable certificate (`src/secrets/Reward.tsx`).

The terminal's `nightshift` command opens **Buzlime: Night Shift**, a branching zombie text
adventure, once a visitor has found five secrets. The whole story — scenes, choices and the
six endings (one of them secret) — lives in `src/adventure/story.ts`.
