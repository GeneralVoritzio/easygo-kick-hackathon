# HYPEPROPS_SPEC.md — Audit

Audited by Claude (Fable 5); technical claims fact-checked against MediaPipe source,
npm registry, and working open-source face-AR implementations by two research subagents.
Verdict up front: **the spec is sound and buildable in a hackathon window** — the
architecture, risk-first build order, and scoping are genuinely good. The issues below
are fixable details, and all of them are already fixed in this implementation.

## Spec bugs found (fixed in this repo)

1. **State machine has no `expiring → active` edge.** Section 5's diagram only flows forward,
   but the whole product moment is a hype surge rescuing a dying placement: if the timer
   is pulsing at 3s and chat pushes it back to 20s, the slot must return to `active`.
   Fixed in `src/engine/slotMachine.ts` + regression test.

2. **"Timer visibly jumps (0:12 → 0:41)" contradicts the extension math.** Section 6's
   `extensionSec += k·max(0, score−baseline)·dt` accrues *gradually* (a few sec per
   sec) — a surge would make the countdown *pause*, not jump. Fixed: `triggerHypeSurge()`
   grants an immediate +15s bonus *and* spikes the crowd, so accrual continues on top.

3. **Hype feedback loop saturates (found live, not on paper).** The spec's mock crowd
   speeds up chat when hype rises, and hype rises when chat speeds up — with the spec's
   implied gain the meter pinned at 100% from *ambient* chatter within seconds, which
   would flatten every demo beat (a surge can't jump a maxed meter). Fixed by setting
   the charge gain so sustained-input equilibrium ≈ 1.8× raw pressure: ambient idles
   ~15–20%, a chat spike reads ~40–50%, only a surge saturates. Verified in-browser.

4. **`object-fit` overlay trap.** Section 7 says to size the canvas to the video's *displayed*
   rect, but if the video is cropped (`cover`) or the container aspect differs from the
   capture aspect (Mac cameras often deliver 4:3, not 16:9), the 1:1 pixel mapping breaks
   and props float off the face. Fixed: `FaceStage` measures the container and letterboxes
   an aspect-exact box that video + canvas share.

## Fact-check results (research subagents, verified against sources)

- **Facial transformation matrix**: column-major (matches `Matrix4.fromArray` — **no
  transpose**), metric **cm**, right-handed, camera at origin looking down −Z, MediaPipe's
  own virtual camera = **63° vertical FOV, near 1cm, far 100m**. That resolves spec
  Decision #3 exactly: camera at origin with those values, `matrixAutoUpdate = false`,
  `matrix.fromArray(...)` per frame. Known open MediaPipe issue: pose can drift when the
  face is far off-center — keep the streamer roughly centered during the demo.
- **Mirroring**: no working implementation compensates in the matrix. Feed the raw video
  to detection and CSS-mirror one shared container holding both video and canvas. (Spec
  left this open; it's the one place sign-flips breed bugs.)
- **`detectForVideo`**: timestamps must be monotonic (`performance.now()`), guard
  duplicate frames via `video.currentTime`, wait for `loadedmetadata` + nonzero
  dimensions before the first detect (avoids a known WebGL crash), GPU delegate with
  CPU fallback (GPU is flaky on iOS Safari — demo on desktop Chrome).
- **Landmark indices** (fallback path): #10 forehead / #234 / #454 temples confirmed;
  for eye centers use **iris centers 468/473** (included by default in the Tasks API —
  no `refineLandmarks` flag needed, that's legacy-API thinking).
- **Stack versions**: all compatible (React 19.2 / Vite 8 / R3F 9.6 / drei 10.7 /
  zustand 5 / Tailwind v4 via `@tailwindcss/vite`, no config file). Two corrections to
  the spec: the package is **`react-router`** now (not `react-router-dom`), and **R3F v9
  removed automatic sRGB conversion** — logo textures need `texture.colorSpace =
  SRGBColorSpace` or brand colors wash out.

## The 5 open decisions, resolved

1. **R3F vs imperative Three.js** → both, at the right altitude: R3F owns the scene
   graph; the per-frame pose is applied imperatively inside `useFrame` from a module-level
   mutable `faceState` (zero React renders per frame). No fighting observed.
2. **Hype constants** → chat full at 6 msg/s, likes 12/s, viewers 15/s; weights
   .5/.3/.2; half-life 2.5s; baseline 0.35; k=10 (≈6.5s earned per second at max hype);
   cap 60s; surge bonus +15s. All in one `HYPE` const object in `src/engine/hype.ts`,
   unit-tested, tune-in-one-place.
3. **Camera alignment** → the 63°/origin recipe above. The nose-cube test the spec
   prescribes is still worth 5 minutes on the demo machine before swapping in props.
4. **Transient face channel** → plain module singleton (`faceState.ts`), not Zustand.
   Zustand's transient API adds indirection for zero benefit at 30–60Hz.
5. **Decal vs baked UV** → drei `<Decal>` (its canonical example is literally a decal
   on a sphere, which is our cap crown). Logos are self-contained SVG data-URLs
   (`textLogo()`), so there is no asset-sourcing dependency anywhere.

## Judgment calls the spec leaves implicit

- **Demo resilience**: prop hides after 350ms of lost tracking (blink-tolerant, no
  ghost props); camera-permission failure shows a readable error instead of a black box.
- **StrictMode off**: double-mounted effects churn getUserMedia + the MediaPipe WASM
  runtime in dev; stability for a live demo beats the dev-mode lint.
- **Real brand names avoided** in seed data (VOLT / Nova / BYTE with strong colors) —
  reads just as well on stage, no trademark sidebar with judges.

## Residual risks (can't be closed from code)

- Anchor offsets (`catalog.ts` `anchor`) are tuned blind — they'll need a 5-minute
  on-camera nudge session (cap height/tilt, glasses depth).
- One-machine dry run of the full beat sequence (tip → hype → surge → rescue → expiry →
  queued second sponsor) before pitching; the director keyboard shortcuts make it scriptable.
