# kick-tool

A small Express server that handles **Kick** OAuth, receives **webhooks**, and
logs everything — with special logging for **chat messages**.

## What it does

- **OAuth 2.1 (PKCE)** — full login flow: `/auth/login` → Kick → `/auth/callback`,
  then saves the access/refresh tokens to `tokens.json`.
- **Auto-subscribes** to `chat.message.sent`, `channel.followed`, and
  `channel.subscription.new` webhooks right after you log in.
- **Webhook receiver** at `POST /webhooks/kick` that **verifies Kick's RSA
  signature** before trusting a payload, then logs it.
- **Logs everything**: every request, every event, and a highlighted line for
  each chat message (`💬 username: message`).

## Setup

1. Create an app at <https://kick.com/settings/developer> and note the
   **Client ID** and **Client Secret**.
2. On the app, set a **Redirect URI** of `http://localhost:3000/auth/callback`
   and a **Webhook URL** pointing at this server's `/webhooks/kick`.
3. Configure env:
   ```bash
   cp .env.example .env
   # edit .env — fill in KICK_CLIENT_ID and KICK_CLIENT_SECRET
   ```
4. Install and run:
   ```bash
   npm install
   npm start        # or: npm run dev  (auto-restart on change)
   ```
5. Open <http://localhost:3000/auth/login> and authorize.

## Receiving real webhooks locally

Kick needs a public HTTPS URL to deliver webhooks. For local dev, tunnel it:

```bash
ngrok http 3000
```

Then set your Kick app's **Webhook URL** to
`https://<your-ngrok-id>.ngrok.io/webhooks/kick` and update `PUBLIC_URL` in
`.env` to match.

## Routes

| Route                 | Purpose                                        |
| --------------------- | ---------------------------------------------- |
| `GET  /`              | Status page + links                            |
| `GET  /auth/login`    | Start the OAuth flow                           |
| `GET  /auth/callback` | OAuth redirect target; exchanges code → tokens |
| `GET  /subscriptions` | List current webhook subscriptions             |
| `POST /webhooks/kick` | Webhook receiver (signature-verified)          |

## Notes

- Token storage is a single `tokens.json` file — fine for a personal tool,
  swap for a real datastore (and per-user sessions) before production.
- Webhook signatures are verified against Kick's public key, fetched from
  `GET https://api.kick.com/public/v1/public-key` and cached in memory.
- Logs go to stdout; capture them with `npm start > server.log 2>&1`.
