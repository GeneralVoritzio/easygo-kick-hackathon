# Kick API reference docs

The Kick endpoints and OAuth model this project builds on. Kick's docs are terse
and occasionally wrong — verify behavior against these pages and the running API,
not from memory. The `.md` variants (append `.md` to a docs URL) return cleaner
text and sometimes more detail than the HTML.

- **Apps setup / getting started:** https://docs.kick.com/getting-started/kick-apps-setup
  — create an app → ClientID / ClientSecret / redirect URL; OAuth 2.1 Code Grant + PKCE per user.
- **OAuth token flow:** https://docs.kick.com/getting-started/generating-tokens-oauth2-flow
  — authorization_code (user tokens) and client_credentials (app tokens) both POST to
  `https://id.kick.com/oauth/token`.
- **Events / webhook subscriptions:** https://docs.kick.com/events/subscribe-to-events
  — user token subscribes to its **own** channel only; app token + `broadcaster_user_id`
  for other channels.
- **Chat send:** https://docs.kick.com/apis/chat (`.md` for detail)
  — `type:"user"` needs a user token + `broadcaster_user_id`; `type:"bot"` needs an app token
  **and** the bot added to the channel. See CLAUDE.md for how this project sidesteps bot-type.
- **Full index:** https://docs.kick.com/llms.txt
