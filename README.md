# Lumix landing

Dark, static landing page for Lumix on Stellar. Built with Next.js App Router, React, TypeScript, Tailwind CSS, and the tokens and logo in `design-system/`. The supplied `Landing-a.html` remains in place as a visual reference.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. For a production run, use `npm run build` and `npm run start`.

## Footer links

Copy `.env.example` to `.env.local` and add **verified official destinations** before building. GitHub, X, Discord, Terms, and Privacy render as non-navigating buttons while their variables are empty. `Docs / How it works` points to the explanatory section on this page unless `LUMIX_DOCS_URL` is set.

The missing destinations are `LUMIX_GITHUB_URL`, `LUMIX_X_URL`, `LUMIX_DISCORD_URL`, `LUMIX_TERMS_URL`, and `LUMIX_PRIVACY_URL`. Values are read at build time because the page is statically rendered.

On desktop, Lenis smooths wheel input. Touch and reduced-motion users keep native scrolling, and the page remains scrollable without JavaScript.

## Checks

Run `npm run lint`, `npm run typecheck`, and `npm run build`. The optional `scripts/browser-check.mjs` checks desktop, tablet, and phone widths through a locally launched Chrome debugging instance. It records document width, layout shifts, accessible control basics, CTA destination, and clipboard behavior. Screenshots go to the system temporary directory unless `LUMIX_SCREENSHOT_DIR` is set. `scripts/interaction-check.mjs` verifies the demo press effect, footer controls, desktop wheel and keyboard scrolling, reduced motion, mobile touch scrolling, and the no-JavaScript fallback.
