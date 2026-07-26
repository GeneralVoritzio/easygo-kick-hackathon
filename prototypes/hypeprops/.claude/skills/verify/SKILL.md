---
name: verify
description: Build, launch and drive the hypeprops app (Vite + React) to verify changes at the browser surface.
---

# Verify hypeprops

- The app lives in `prototypes/hypeprops/` — run every npm command from that directory (ignore `kicktool/`). `npm run dev -- --port 5199 --strictPort` to launch; `npm run build` runs `tsc -b` first, so it doubles as the typecheck.
- Tests: `npm test` (vitest, pure-function suites only — no DOM tests).
- Drive the UI with Playwright headless Chromium (install into a temp dir, e.g. `/tmp/<task>-verify`, `npm i playwright && npx playwright install chromium`). WebGL works via SwiftShader — the 3D globe renders fine headless.
- Discovery globe specifics:
  - Grant geolocation via context options (`geolocation` + `permissions: ['geolocation']`) to exercise the intro flight; omit them for the denied/default-region path.
  - Hotspots are canvas pixels — find one by scanning `mouse.move` in an expanding spiral from canvas center and checking for popover DOM (`getByText(/live$/)`).
  - Wheel-zoom only works when the pointer is over the canvas — `mouse.move` onto the globe before `mouse.wheel`.
  - Kick iframes (`player.kick.com`) return 403/X-Frame-Options for invalid slugs — only `maxholloway`-backed channels actually embed.
