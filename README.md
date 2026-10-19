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

## Easter eggs

Secrets are listed in `src/secrets/registry.ts`. To add one, add an entry there and call
`unlock("<id>")` (from `src/secrets/store.ts`) where it's triggered — the footer counter, the
secrets panel and the "secret found" toast update automatically. Progress is stored in the
visitor's browser only.
