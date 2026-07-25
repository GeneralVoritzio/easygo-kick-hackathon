"use strict";

// .env is loaded by node --env-file-if-exists=.env (see package.json scripts).

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const log = require("./src/logger");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// Server's public base URL (no trailing slash). The OAuth callback and webhook
// URLs are derived from it, so it's the only address you configure.
const publicUrl = (process.env.PUBLIC_URL || "http://localhost:3000").replace(/\/+$/, "");

// Secret key for the OBS overlay URL: generated once and persisted to
// overlay-key.json so the OBS URL is stable across restarts.
function resolveOverlayKey() {
  const file = path.join(__dirname, "overlay-key.json");
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")).key;
  } catch {
    const key = crypto.randomBytes(24).toString("hex");
    fs.writeFileSync(file, JSON.stringify({ key }, null, 2));
    return key;
  }
}

const config = {
  clientId: process.env.KICK_CLIENT_ID,
  clientSecret: process.env.KICK_CLIENT_SECRET,
  publicUrl,
  redirectUri: `${publicUrl}/auth/callback`,
  // Exactly what the code calls: /users, /chat, /events/subscriptions. This is
  // also what Kick actually grants — it silently drops scopes the app lacks.
  scopes: "user:read chat:write events:subscribe",
  port: Number(process.env.PORT) || 3000,
  // Echo bot: reply to every incoming chat message. On by default; set ECHO=false to disable.
  echoEnabled: process.env.ECHO !== "false",
  // The bot account's username — used as the loop guard: its own messages are never echoed.
  botUsername: process.env.BOT_USERNAME || "Martibot",
  overlayKey: resolveOverlayKey(),
};

if (!config.clientId || !config.clientSecret) {
  log.warn("KICK_CLIENT_ID / KICK_CLIENT_SECRET are not set. Copy .env.example to .env and fill them in.");
}

const app = express();

// Capture the raw request body so we can verify webhook signatures. Kick signs
// the exact bytes it sent, so we must hash the raw payload, not a re-serialized
// version of the parsed object.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString("utf8");
    },
  })
);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use(require("./src/routes/home")(config));
app.use(require("./src/routes/auth")(config));
app.use(require("./src/routes/webhooks")(config));

// Overlay: the SSE stream (before static, so /overlays/stream hits the handler,
// not a missing-file lookup), then the static overlay pages.
app.use(require("./src/routes/overlay")(config));
app.use(
  "/overlays",
  express.static(path.join(__dirname, "public/overlays"), {
    // Each overlay is a folder with an index.html (/overlays/chat/ -> chat/index.html).
    setHeaders: (res) => res.set("Cache-Control", "no-cache"), // so OBS picks up edits
  })
);

// ponytail: 404 + 500 fallbacks are Express's own defaults — not reimplemented here.

app.listen(config.port, () => {
  log.info(`Kick tool listening on http://localhost:${config.port}`);
  log.info(`Log in at http://localhost:${config.port}/auth/login`);
  log.info(`Webhook endpoint: ${config.publicUrl}/webhooks/kick`);
  log.info(`Echo bot: ${config.echoEnabled ? `ON (as "${config.botUsername}")` : "OFF"}`);
  log.info(`Overlay — chat:   ${config.publicUrl}/overlays/chat/?key=${config.overlayKey}`);
  log.info(`Overlay — alerts: ${config.publicUrl}/overlays/alerts/?key=${config.overlayKey}`);
});
