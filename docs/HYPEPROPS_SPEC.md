# HypeProps — Build Spec

> A live, hype-priced brand-prop marketplace for Kick streams. Verified brands tip real-time 3D props (hats, glasses) onto a streamer's face-cam; audience hype extends how long the paid placement stays on. This doc is written to hand to **Claude Code** to build the demo. It gives a strong recommended architecture but explicitly flags the calls Claude Code should finalize for elegance.

---

## 1. What we're building (and what we're NOT)

**One-line pitch:** Brands don't buy flat sponsor reads — they bid props into live hype windows, and the crowd's energy decides how long the ad lives.

**The demo is a single-page web app** with two routes and one real technical artifact (face tracking). Everything else is *simulated but structurally real* — mock data flowing through a real event pipeline, so the story "the payment is faked, the system is not" holds up under judge questions.

### In scope (MVP — must work reliably)
- **Route A — Stream view:** a Kick-matching stream UI with simulated live chat, viewer/like counters, the streamer's webcam as the video, and the live prop overlay.
- **Real-time 3D prop on the face** via MediaPipe + Three.js. This is the credibility anchor. It must be smooth.
- **Sponsor event → prop appears** with a "Sponsored by {Brand} ✓ Verified" lower-third and a countdown timer.
- **Hype loop:** chat/like velocity feeds a hype score; while a prop is live, rising hype *visibly extends* the countdown (up to a cap).
- **Route B — Brand console:** a "verified brand" picks a base prop (hat/glasses), applies a skin (color + logo + finish), previews it, and saves it to their prop library. Saved props are what get tipped into the stream.

### Out of scope (say this out loud in the pitch — it's good scoping, not a gap)
- Real payments / real KYC (mocked as a verified badge + a fired event).
- Real Kick API integration (chat + events are simulated, but shaped like real Kick webhook payloads so they're swappable).
- Face **tattoos** / mesh-warped decals — explicitly a stretch goal, kept off the critical path.

---

## 2. Recommended stack

| Concern | Choice | Why |
|---|---|---|
| Build tool | **Vite + React + TypeScript** | Fast HMR, clean for a 3–4h build |
| Face tracking | **MediaPipe Tasks Vision — `FaceLandmarker`** | In-browser, 468 landmarks **+ facial transformation matrix** (head pose) |
| 3D rendering | **Three.js via React Three Fiber (`@react-three/fiber`) + `@react-three/drei`** | Declarative prop anchoring; `<Decal>` for logos |
| State | **Zustand** | Minimal, single store, transient (non-rerender) updates for per-frame face data |
| Styling | **Tailwind CSS** | Fast path to a polished Kick-dark UI |
| Routing | **React Router** | Two routes |
| Backend | **None** | Everything in-browser; a mock event bus stands in for Kick |

> **Decision for Claude Code #1:** confirm R3F + drei vs. raw Three.js. R3F is recommended for elegance, but if per-frame matrix updates fight React's render cycle, drop the prop rig to an imperative Three.js layer driven by a ref. Prototype the face-pin *first* and let that result decide.

---

## 3. Architecture overview

Three decoupled subsystems talking through one Zustand store:

```
                    ┌─────────────────────────────┐
   webcam ─────────▶│  FaceTracker                │
                    │  MediaPipe loop (rAF)       │
                    │  → writes transform matrix   │──┐ (transient ref, no rerender)
                    └─────────────────────────────┘  │
                                                      ▼
   mock events ────▶┌─────────────────────────────┐  faceRef
   (chat, likes,    │  Engine (Zustand store)     │  │
    sponsor tips)   │  • hype score (decaying)    │  │
                    │  • slot state machine       │  │
                    │  • prop catalog / brands    │  │
                    └─────────────────────────────┘  │
                          │ activeSlot, hype          │
             ┌────────────┴───────────┐               │
             ▼                        ▼               ▼
      ┌────────────┐          ┌──────────────┐  ┌──────────────┐
      │ Kick UI    │          │ HUD overlay  │  │ PropCanvas   │
      │ chat,      │          │ lower-third, │  │ R3F, reads   │
      │ counters   │          │ timer, hype  │  │ faceRef +    │
      └────────────┘          │ meter        │  │ activeSlot   │
                              └──────────────┘  └──────────────┘
```

**Key elegance principle:** per-frame face pose is *transient* — it must not trigger React re-renders. Write the transformation matrix into a mutable ref (or Zustand's non-reactive `getState`/`setState` with a ref pattern), and let the R3F `useFrame` loop read it. React state is reserved for discrete things (active slot, hype score sampled at ~4–10Hz, chat messages).

---

## 4. Data model

```ts
type Brand = {
  id: string;
  name: string;            // "Pepsi"
  verified: boolean;       // mock KYC → always true once "signed in"
  logoUrl: string;
  primaryColor: string;    // hex
};

type PropModel = {
  id: string;
  type: 'hat' | 'glasses';
  name: string;
  glbUrl: string;          // or 'primitive:cap' fallback (see §7)
  anchor: AnchorConfig;    // offset/scale relative to head pose
};

type Skin = {
  baseColor: string;       // hex
  logoUrl?: string;        // projected via <Decal>
  finish: 'matte' | 'gloss' | 'metallic';
};

type BrandProp = {         // the sellable unit, created in Route B
  id: string;
  brandId: string;
  propModelId: string;
  skin: Skin;
  priceUsd: number;        // e.g. 2000
  baseDurationSec: number; // e.g. 30
};

type SponsorEvent = {      // mock "tip"; shaped like a Kick webhook event
  id: string;
  brandPropId: string;
  amountUsd: number;
  ts: number;
};

type Slot = {              // the live placement
  brandProp: BrandProp;
  startedAt: number;
  baseDurationSec: number;
  extensionSec: number;    // grows with hype, capped
  state: 'entering' | 'active' | 'expiring' | 'exiting';
};

type Hype = {
  score: number;           // 0..1 normalized, decays
  chatVelocity: number;    // msgs / rolling window
  likeVelocity: number;
  viewers: number;
};
```

> **Decision for Claude Code #2:** finalize the hype normalization + extension curve (see §6). Keep it a pure, unit-testable function `nextHype(prev, events, dt)` and `extensionFor(hype, dt)` — this is the "real system" you point judges to.

---

## 5. Prop lifecycle (state machine)

```
idle
  └─(SponsorEvent)─▶ entering ──(~400ms anim)──▶ active
                                                   │
                          (hype extends expiresAt) │
                                                   ▼
                             active ──(timeLeft ≤ 5s)──▶ expiring (pulse)
                                                   │
                                    (timeLeft ≤ 0) ▼
                                              exiting ──▶ idle
```

- `expiresAt = startedAt + (baseDurationSec + min(extensionSec, MAX_EXTENSION_SEC)) * 1000`
- **Queue + cooldown:** SponsorEvents arriving while non-idle enqueue; process next after a short cooldown once `idle`. Two queued sponsors = the "live auction" beat in the demo.
- Only one active slot in MVP (single face, single prop). Stretch: hat + glasses simultaneously = two slots with different anchors.

---

## 6. Hype engine (the on-theme core)

Feeds: simulated chat messages, like bursts, viewer count. Maintain rolling-window velocities.

Recommended shape (Claude Code to tune constants):
- `rawHype = w1*norm(chatVelocity) + w2*norm(likeVelocity) + w3*norm(viewerDelta)`
- `score = clamp(decay(prevScore, dt) + rawHype, 0, 1)` — exponential decay toward 0 so hype must be *sustained*.
- **Extension while active:** per tick, `extensionSec += k * max(0, score - baseline) * dt`, capped at `MAX_EXTENSION_SEC`. Net effect: a chat surge visibly ticks the countdown back up.
- Expose a **`triggerHypeSurge()`** action bound to a keypress so the presenter fires the money beat on cue (timer visibly jumps, e.g. 0:12 → 0:41).

The whole engine is deterministic given an event stream → easy to demo, easy to test, easy to explain.

---

## 7. Face tracking + prop rendering (the risk — spec it tightly)

**Pipeline:**
1. `getUserMedia({ video })` → `<video>` element (mirrored for selfie feel).
2. `FaceLandmarker.createFromOptions(vision, { runningMode: 'VIDEO', numFaces: 1, outputFacialTransformationMatrixes: true, outputFaceBlendshapes: false })` with **GPU delegate**.
3. rAF loop: `detectForVideo(video, ts)` → take `facialTransformationMatrixes[0]` (a 4×4) and `faceLandmarks[0]`. Write matrix into `faceRef.current` (no setState).
4. **PropCanvas** (R3F `<Canvas>`, transparent, absolutely positioned over the video, size-synced to the video's *displayed* rect):
   - Set up a camera matching MediaPipe's canonical face camera (drei `<PerspectiveCamera>`; tune FOV/near/far to align).
   - A `<FaceAnchor>` group applies the transformation matrix each `useFrame` (`group.matrixAutoUpdate = false; group.matrix.fromArray(faceRef.current)`).
   - The active prop GLB is a child of the anchor, offset by `PropModel.anchor` (hats sit above/forward of the head origin; glasses sit at the eye line).

**Recommended primary approach:** the **facial transformation matrix** gives full head pose (rotation + translation) for free — cleaner than hand-mapping landmarks. **Fallback if alignment is fiddly:** anchor to specific landmarks (e.g. forehead top ~#10, temples ~#234/#454, eye centers for glasses) and derive orientation from their spread. Prototype the matrix path first; keep the landmark path as plan B.

**Skins:** load prop GLB, override material `color`/`metalness`/`roughness` from `Skin.finish`, and project the logo with drei `<Decal>` onto the prop front. If a GLB asset is unavailable, **primitive fallback:** build a cap from a hemisphere + a flattened torus/box brim, and glasses from two ring geometries + a bar — parametric, no asset dependency, still skinnable. Ship the primitive fallback first so rendering is never blocked on asset sourcing; swap in nicer GLBs if ahead.

**Gotchas to handle up front:** mirror consistency between video and canvas; canvas resize on layout change; cap detection to video fps and skip frames if behind; lighting (add ambient + directional so materials read on any webcam).

> **Decision for Claude Code #3:** confirm camera/FOV alignment method between MediaPipe's canonical space and the R3F camera. This is the one place alignment bugs hide — isolate it in a tiny test scene (a cube pinned to the nose) before loading real props.

---

## 8. Routes & UX

### Route A — `/stream` (the demo stage)
- **Layout mirrors Kick:** dark theme, main video left/center, chat panel right, top bar with channel name + live viewer count + like count.
- **Video** = the webcam (`<video>`), with **PropCanvas** overlaid.
- **Overlay HUD:** bottom lower-third "Sponsored by {Brand} ✓ Verified" + brand color accent; **countdown timer**; **hype meter** (bar or radial) that visibly moves.
- **Simulated chat:** messages auto-scroll from a scripted + randomized pool; supports a `!sponsor {brand}` style command as an alt trigger.
- **Director panel** (toggleable, hidden during pitch or on a second screen): buttons to fire a sponsor tip, spike chat, and `triggerHypeSurge()`. Keyboard shortcuts for a hands-free scripted demo.

### Route B — `/brand` (verified brand console)
- **Mock sign-in** → shows "✓ Verified Brand" state (this sells the KYC story visually).
- **Pick base prop:** hat or glasses from the catalog.
- **Apply skin:** color picker, logo select/upload, finish toggle (matte/gloss/metallic).
- **Live preview:** render the skinned prop on a rotating 3D head *or* on the user's own webcam (reuse PropCanvas — nice reuse win).
- **Set price + base duration**, then **Save to library** → creates a `BrandProp` that becomes tippable in `/stream`.

Shared design language across both routes; reuse the prop-render component so the brand preview and the live stream are provably the same rendering path.

---

## 9. Suggested module layout

```
src/
  engine/
    store.ts            // Zustand: hype, slot machine, catalog, brands
    hype.ts             // pure nextHype() / extensionFor()  ← unit-tested
    slotMachine.ts      // pure transitions
    mockEvents.ts       // Kick-shaped event generators (chat, likes, tips)
  face/
    FaceTracker.tsx     // webcam + MediaPipe loop → faceRef
    PropCanvas.tsx      // R3F canvas, FaceAnchor, prop + skin + decal
    primitives.ts       // fallback cap/glasses geometry
  stream/
    StreamView.tsx      // Kick layout
    Chat.tsx
    Hud.tsx             // lower-third, timer, hype meter
    DirectorPanel.tsx
  brand/
    BrandConsole.tsx
    PropPicker.tsx
    SkinEditor.tsx
  data/
    catalog.ts          // PropModels, seed Brands/BrandProps
  App.tsx / router
```

---

## 10. Build order (risk-first, so there's always a demoable thing)

1. **Face-pin proof:** webcam → MediaPipe → a cube stuck to the nose. Nothing else until this is rock solid.
2. Swap cube for a **primitive cap** anchored correctly (handles head tilt).
3. **Engine store** + slot state machine + a button that fires a SponsorEvent → prop enters/exits on a timer.
4. **Kick stream shell** + simulated chat + counters.
5. **Hype engine** wired to chat/likes; **timer extension** + `triggerHypeSurge()`; hype meter + countdown in the HUD.
6. **Lower-third** "Sponsored ✓ Verified" + brand accent.
7. **Brand console** (`/brand`): pick prop → skin (color + logo decal + finish) → save → appears as tippable.
8. **Polish:** Kick-accurate styling, prop enter/exit easing, expiring pulse, a second queued sponsor for the auction beat.
9. **Stretch only if ahead:** swap primitives for GLB models; attempt one mesh-warped face decal.

Everything from step 3 onward is demoable on its own, so you never risk having nothing to show.

---

## 11. Open questions for Claude Code to resolve elegantly
1. R3F declarative rig vs. imperative Three.js layer for per-frame pose (prototype-driven).
2. Final hype normalization weights + extension curve constants.
3. MediaPipe-canonical ↔ R3F camera alignment method (isolate and verify with the nose-cube test).
4. Transient face-data channel: mutable ref vs. Zustand transient — pick whichever keeps the render loop clean.
5. Logo-on-prop: drei `<Decal>` vs. baked UV texture — Decal is likely more flexible for curved hat fronts.
