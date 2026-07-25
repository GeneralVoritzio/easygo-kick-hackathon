# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # node --env-file-if-exists=.env main.js
npm run dev        # same + --watch (auto-reload on file change)
npm test           # node check.js — overlay bus/SSE self-check
node --check <f>   # syntax-check a file
```

`check.js` is the only test: it asserts the overlay key gate, chat ring buffer, replay-on-connect,
and live SSE fan-out. Everything else is verified by syntax-checking and by booting the server and
hitting endpoints with `curl`. There is **no dotenv dependency** — `.env` is loaded by Node's own
`--env-file-if-exists` flag in the npm scripts, so `node main.js` alone won't see it.
The server binds port 3000 (`PORT`), so a running dev instance will cause `EADDRINUSE` if you
try to start a second one — stop the other first.

## Architecture

An Express server for a single Kick streamer: it completes Kick OAuth, subscribes to webhooks,
receives them, and echoes chat back as a bot. Entry point is `main.js` (config + middleware +
route mounting + startup only).

**Module boundaries are deliberate — respect them when adding code:**

- `src/kick.js` — **only** functions that directly call a Kick HTTP endpoint (token exchange,
  user/subscription/chat API, webhook public-key + signature verify). Nothing that doesn't hit
  the network belongs here.
- `src/routes/*.js` — one file per endpoint, each owning its handler _and_ its logic. Route
  modules export a **factory** `(config) => router`. `webhooks.js` contains the event dispatch +
  echo bot; `auth.js` contains PKCE/state generation + the login/callback routes + `autoSubscribe`.
- `src/tokens.js` — token persistence **and auto-refresh**, one file per role: `streamer` →
  `tokens.json`, `bot` → `tokens.bot.json`. `loadTokens` / `saveTokens` are the raw accessors;
  **callers should use `getAccessToken(role, config)`**, which refreshes on demand and returns
  `null` only when the role genuinely has to log in again. This is the one module that requires
  `kick.js` — refreshing is inherently persistence + network. See "Token refresh" below.
- `src/logger.js` — stdout logger with level filtering (see below), colored via `util.styleText`.
- **OBS overlays** — `src/routes/overlay.js` owns both the bus and the stream: a module-level
  stdlib `EventEmitter` + chat-only ring buffer (50), exported as `overlay.publish(evt)` alongside
  the router factory. `handleEvent` in `webhooks.js` calls `publish({kind})` for chat/follow/sub.
  The route is a key-gated SSE endpoint `GET /overlays/stream?key=` that replays the buffer then
  pushes live events (25s heartbeat, `emitter.off` on `req 'close'`). The overlay **pages are static files**, one folder per overlay in
  `public/overlays/` (`chat/index.html`+`chat.js`, `alerts/index.html`+`alerts.js`, shared
  `client.js`/`overlay.css` at the root), served by `express.static` mounted at `/overlays` so
  `/overlays/chat/` serves `chat/index.html`. The SSE route is mounted **before** the static
  middleware. `client.js` uses the **absolute** path `/overlays/stream` (relative would break from a
  subfolder). Pages read the key from their own URL and filter events client-side via
  `connectOverlay({kind: handler})` — adding an overlay is one new folder (`index.html`+`.js`), no
  server change. Follows/subs are never buffered (would
  re-pop stale alerts on reload); chat is. The overlay key is resolved in `main.js`
  (`resolveOverlayKey`: read `overlay-key.json`, else generate + persist) — not configurable by env,
  so the OBS URL stays stable across restarts.

**Webhook signature verification depends on the raw request body.** `main.js` captures it via
the `express.json({ verify })` hook into `req.rawBody`, because Kick signs the exact bytes it
sent — hashing the re-serialized parsed object would fail. Don't remove that hook.

**Logging / log filtering.** The single filter point is in `src/logger.js`: `LOG_LEVEL`
(debug|info|warn|error, default info) gates DEBUG/INFO/WARN/ERROR. `EVENT` is unranked and
**always prints** — incoming webhooks and chat both log at `EVENT` so they're visible regardless
of level. Bump `LOG_LEVEL=debug` to see full webhook payloads and duplicate-callback notices.

## Token refresh (you log in once per account, not once per 2 hours)

Kick access tokens last `expires_in: 7200` (2h). `tokens.getAccessToken(role, config)` checks the
stored `obtained_at + expires_in` against a 60s margin and, if stale, POSTs
`grant_type=refresh_token` to `id.kick.com/oauth/token` (no `redirect_uri` on this grant) and saves
the result. Verified live: **both the access token AND the refresh token rotate on every refresh.**

Two consequences, both load-bearing:

1. **The new `refresh_token` must be persisted or the chain dies.** `saveTokens` runs in the same
   `.then` as the refresh for exactly this reason — the old refresh token is dead the moment Kick
   responds.
2. **Refreshes are single-flighted per role** (`refreshing` Map in `tokens.js`). Chat is bursty; N
   simultaneous echoes would otherwise fire N refreshes, and because the token rotates, all but one
   would be invalidated. Don't remove that Map.

A failed refresh resolves to `null` (logged once, not once per waiter) → the caller tells the user
to re-login. Nothing refreshes in the background or on a timer; it's lazy, on first use after
expiry. Only the bot path calls this today — the streamer token is only needed at
`autoSubscribe` time, since subscriptions persist server-side.

## The two-account model (central design — read before touching auth/echo)

One Kick app (ClientID/Secret) but **two user logins**, because no single credential can both
hear and speak as a distinct name:

- **Streamer** (`/auth/login`, `tokens.json`) — _hears_ chat. Webhook subscriptions are
  own-channel only, so only the streamer's token can subscribe to the streamer's chat. Its
  callback runs `autoSubscribe`.
- **Bot** (`/auth/login/bot`, `tokens.bot.json`) — _speaks_. Echo sends as this separate account
  with `type:"user"` + `broadcaster_user_id` (taken straight from the webhook payload's
  `broadcaster.user_id`), so it posts under the bot account's name. Its callback does **not**
  subscribe. The bot account should be a **moderator** in the channel so followers-only / subs /
  slow mode don't block it.

App credentials alone grant zero channel access — acting in a channel always comes from a user
authorizing via OAuth. `type:"bot"` + app token was tried and abandoned: it needs the app's bot
"added to the channel" plus `chat:write` on the app token (its `scope` comes back `undefined`),
and returned 401/500. `sendChatMessage` therefore hardcodes `type:"user"` — don't reintroduce the
bot path without that account-side setup.

## Other Kick API gotchas

- **Monitoring other channels** would need an app (client-credentials) token with
  `broadcaster_user_id` per channel — not currently implemented.
- The **echo loop guard** is `BOT_USERNAME`: messages whose sender username matches the bot
  account (case-insensitive) are never echoed. Without it the bot replies to its own `Echo:`
  messages forever.
- OAuth `/auth/callback` is made **idempotent** — state is marked `done` (not deleted) so the
  duplicate callback browsers/proxies sometimes fire is a no-op redirect, not an error. The role
  (streamer/bot) is carried through the flow in the pending-state entry.

## Reference docs

Kick API doc links this project depends on are in `kick-docs.md` — consult them (and
verify against the live API) rather than trusting Kick's HTML docs or memory; they're terse and
sometimes wrong.

## Config (`.env`, see `.env.example`)

`KICK_CLIENT_ID`/`KICK_CLIENT_SECRET` (required) and `PUBLIC_URL` are the only addresses you set:
the OAuth redirect (`PUBLIC_URL/auth/callback`) and webhook (`PUBLIC_URL/webhooks/kick`) URLs are
derived from it (trailing slash stripped in `main.js`), so register those two on the Kick app.
Also `PORT`, `ECHO` (`false` to disable echo), `BOT_USERNAME` (bot account name; the echo loop
guard), `LOG_LEVEL`. Scopes are hardcoded in `main.js` (they're fixed by which endpoints the
server calls). Kick needs a public HTTPS URL to deliver webhooks; tunnel local dev (ngrok /
Tailscale Funnel) and set `PUBLIC_URL` + the app's webhook URL to the tunnel.
