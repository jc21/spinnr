# Spinnr - Spin the Wheel

A browser-only spinner wheel built with React, TypeScript and Vite. No backend — wheel options, sound preference and recent winners are stored in `localStorage`.

## Run

```bash
npm install
npm run dev       # dev server at http://localhost:5173
npm run build     # type-check + production build to dist/
npm run preview   # serve the production build
```

`dist/` is plain static files and can be hosted anywhere (S3, Netlify, GitHub Pages, …).

## Features

- Add options (paste `a, b, c` to add several), edit inline, remove, shuffle, sort, clear
- Smooth requestAnimationFrame spin with an ease-out glide, a pointer that flicks on each slice, and Web Audio tick and win sounds (mutable)
- Winner chosen with `crypto.getRandomValues` (unbiased), then the wheel lands on it
- Confetti, winner dialog with "Spin again" or "Remove & close"
- Space bar to spin, respects `prefers-reduced-motion`, responsive down to phone widths
- State syncs across open tabs
- **Share** button creates a link (`?w=…`) carrying every option and whether it's ticked. Opening it loads that wheel; if you already have a saved wheel you're asked before it's replaced. The parameter is removed from the address bar after loading.

## Structure

```
src/
  App.tsx                    app shell, state, persistence
  components/Wheel.tsx       SVG wheel + spin animation
  components/OptionsPanel.tsx
  components/WinnerModal.tsx
  components/SharePopover.tsx  share link + copy
  components/ImportPrompt.tsx  confirm before loading a shared wheel
  components/Confetti.tsx    canvas confetti
  hooks/useLocalStorage.ts   persisted, validated, cross-tab state
  lib/share.ts               share-link encode/decode
  lib/                       colours, sound, RNG, types
```
