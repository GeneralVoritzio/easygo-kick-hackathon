# Login / Signup + Creator Dashboard — Implementation Plan

## Background & Goals

Give the hypeprops prototype an account system: turn the TopBar's decorative Log In / Sign Up buttons into a real, usable Kick-style login/signup flow, and let signed-in users open a **Creator Dashboard** — the streamer-side live-stats surface. Everything runs on mock data, but named and shaped per `.claude/KICK-API-CONVENTIONS.md`, so the difference from real Kick is not tellable.

This also closes the optional steps 8–9 that `docs/INTERACTION_ENGINE_SPEC.md` admits were never built (streamer-side dashboard: unanswered backlog, attention concentration).

## Confirmed Product Decisions

1. **Positioning: Creator Dashboard** (streamer-side stats surface); no viewer account pages.
2. **Auth form factor: Kick-style modal** — the TopBar buttons open a modal on the current page, no dedicated routes.
3. **Signup depth: a working mock signup** — actually creates an account (persisted to localStorage) and signs in automatically; the email-verification step clears instantly, in the style of BrandConsole's mock KYC.
4. **Default account: `HypeKing / kickhype2026`** — a pre-seeded streamer account; logging in shows the full live data of the existing interaction engine.

## Existing Foundations

- The Log In / Sign Up buttons in `TopBar.tsx` are currently decorative links to `/brand`.
- `useEngine` (viewers, hype, chat, likes, feedMode) and `useInteraction` (response odds, badges, acked messages, transcript) already produce most of the data the dashboard needs, in real time.
- `BrandConsole` sets the precedent for mock sign-in (pick a brand + fake KYC checklist) — match its style.
- No chart library in the dependencies; trend charts are inline SVG sparklines, no new deps.
- Design constraints: use the tokens from `.claude/KICK-DESIGN-SPEC.md` verbatim; keep `#53fc18` green under 10% of visible pixels.

## Product Definition

### Auth flow

**Login modal** (opened by TopBar's Log In)
- Fields: Email or username / Password; inline Kick-style errors on failure ("Incorrect username or password").
- A demo-credentials hint at the bottom: `HypeKing / kickhype2026` (needed for hackathon demos; a real product wouldn't ship this).
- On success the modal closes and the TopBar switches to an avatar + username menu.

**Signup modal** (opened by TopBar's Sign Up — three steps, pacing modeled on Kick's real signup)
1. Email → send verification code (mock: "code sent" appears instantly, the input comes pre-filled, one click passes);
2. Username + Password (username uniqueness checked against existing accounts and the mock channel catalog);
3. Birthday (Kick has an age gate) → done, signed in automatically.
- Newly registered accounts are "new streamers": every dashboard module shows an honest empty state (see below).

**Session & persistence**
- New `src/auth/authStore.ts` (zustand + persist middleware → localStorage).
- Stores: `accounts[]` (including the pre-seeded HypeKing) + `session` (the signed-in user_id). Sessions survive page reloads.
- User objects are shaped per the API conventions (snake_case, field names aligned with `GET /public/v1/users`):
  `{ user_id, name, email, profile_picture }`, with extensions in the same style (`created_at`, `is_verified`).
- Mock passwords are stored in localStorage in plaintext — acceptable for a demo; stated explicitly in code comments and in this plan, with no pretense of encryption.
- Signed-in TopBar: avatar (gradient + initials, same style as existing channel avatars) → dropdown menu: Creator Dashboard / Log out.

### Creator Dashboard (`/dashboard`)

Visiting `/dashboard` while signed out → redirect to `/stream` and auto-open the Login modal.

Layout modeled on dashboard.kick.com: a narrow left nav (just Overview for now, leaving room to grow) + a main area of module cards. Modules top to bottom:

1. **Session overview strip** — LIVE status badge, `viewer_count` (live from the engine), session duration (accumulated while signed in), hype score, chat velocity, likes. All numbers come from the existing stores and tick in real time.
2. **Interaction Engine panel** (this project's differentiator; closes spec steps 8–9):
   - current response odds (`formatOdds`) and earned badges;
   - unanswered backlog: the latest N un-acked chat messages, annotated with wait time;
   - attention concentration: a digest of how acked messages distribute across chatters (reusing interactionStore's accounting).
3. **Viewer trend sparkline** — drawn as inline SVG; the default account backfills from seeded history (see below), then a live ring-buffer sampler (e.g. 5s × 120 points) keeps appending after mount; read the dataviz skill before writing any chart code.
4. **Recent streams** — for the default account, a pre-seeded list of the last 5–7 stream sessions: date, duration, peak/average viewers, message count, that session's response odds.
5. **Channel info card (read-only to start)** — category, title, language, follower count; editing comes in a later round.

### Mock data for the default account

HypeKing's dashboard must be more than live-ticking numbers — it needs a seeded streamer history (new `src/data/creatorStats.ts`, fixed seed, names per the API conventions):

- channel aggregates: `follower_count`, lifetime hours streamed, 30-day watch-time totals;
- the last 5–7 stream sessions: `started_at` / `ended_at`, peak and average `viewer_count`, chat message count, an odds digest for the session — feeding the Recent streams module;
- a historical series for the viewer trend (everything before the current session), so the sparkline has a shape on open instead of drawing from zero.

**Empty states for newly registered accounts**: overview shows zeros + "You haven't streamed yet"; the interaction panel shows "start streaming to measure your odds"; trend and session list show empty-state guidance. No fabricated data.

### Out of scope (this round)

- Viewer-side account pages, KICKs wallet, subscription management, password recovery, OAuth;
- write operations on channel settings;
- dedicated mobile layouts (the responsive grid degrades naturally).

## Implementation Plan

### 1. Auth store and the seeded account
- `src/auth/authStore.ts`: zustand persist; `accounts`, `session`, `signIn/signUp/signOut`, pure validation functions for username/email.
- Pre-seed `HypeKing / kickhype2026` (user object named per the API conventions).
- Unit tests for the pure validation functions (username rules, uniqueness, minimum password strength).

### 2. Auth modal and TopBar integration
- `src/auth/AuthModal.tsx`: login / signup modes, the three-step flow, Escape/backdrop-click to close; inline errors.
- `TopBar.tsx`: signed out → Log In / Sign Up open the modal; signed in → avatar dropdown (Dashboard / Log out).
- Modal state lives in the authStore (`authModal: 'login' | 'signup' | null`) so any page can trigger it.

### 3. Dashboard route and shell
- Add `/dashboard` to `App.tsx`; `src/dashboard/DashboardPage.tsx` shell + guard (signed-out redirect + login modal).
- Left nav, page header (channel name + LIVE badge).

### 4. Wiring the data modules
- `SessionOverview.tsx`, `InteractionPanel.tsx` (odds/badges/backlog/concentration) wired to `useEngine`/`useInteraction`.
- The dashboard must run `startMockEvents()` while mounted (same source as StreamView) to keep the data flowing.

### 5. Default-account history and the trend chart
- `src/data/creatorStats.ts`: HypeKing's seeded streamer profile (lifetime aggregates, recent sessions, trend history series) + data unit tests;
- `useViewerTrend` ring-buffer hook: historical backfill + live sampling stitched together; SVG sparkline (read the dataviz skill first);
- `RecentStreams.tsx` session list module.

### 6. Polish and verification
- Full coverage of empty states (newly registered accounts);
- `npm run build`, `npm test`, `npm run lint`;
- Playwright manual paths: default-account login → every dashboard module shows live data; wrong password errors; sign up a new account → empty-state dashboard; log out; signed-out `/dashboard` redirect; session survives reload.

## Small Items Left to Confirm

1. Besides Dashboard / Log out, Kick's avatar menu also has Profile, Settings, etc. — add a few disabled placeholders for authenticity? (Default: yes, disabled.)
2. Should the dashboard's left nav carry disabled placeholders like Analytics / Moderation? (Default: yes, only Overview enabled.)
