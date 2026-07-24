"use strict";

// Token persistence, one file per role (single user per role — fine for a
// personal tool; swap for a real store in prod):
//   streamer -> tokens.json      (receives chat via webhooks; owns subscriptions)
//   bot      -> tokens.bot.json  (posts chat as a separate account)
// Two Kick accounts authorize separately because subscribing is own-channel
// only (streamer) while posting as a distinct name needs the bot's own token.

const fs = require("fs");
const path = require("path");
const kick = require("./kick");
const log = require("./logger");

const FILES = {
  streamer: path.join(__dirname, "..", "tokens.json"),
  bot: path.join(__dirname, "..", "tokens.bot.json"),
};

// Refresh this long before the access token actually expires, so a request
// can't start with 3 seconds of validity left and land after expiry.
const EXPIRY_MARGIN_MS = 60_000;

function saveTokens(tokens, role = "streamer") {
  const withMeta = { ...tokens, obtained_at: Date.now() };
  fs.writeFileSync(FILES[role], JSON.stringify(withMeta, null, 2));
  return withMeta;
}

function loadTokens(role = "streamer") {
  try {
    return JSON.parse(fs.readFileSync(FILES[role], "utf8"));
  } catch {
    return null;
  }
}

function isExpired(saved, now = Date.now()) {
  if (!saved?.access_token) return true;
  if (!saved.expires_in || !saved.obtained_at) return true; // unknown age — assume stale
  return now >= saved.obtained_at + saved.expires_in * 1000 - EXPIRY_MARGIN_MS;
}

// One in-flight refresh per role. Chat is bursty: without this, five messages
// arriving at once fire five refreshes, and since Kick rotates the refresh
// token each call, four of them invalidate the token the others just saved.
const refreshing = new Map();

// Returns a usable access token for the role, refreshing it first if it's
// expired. Null means the role has to log in again (no tokens, no refresh
// token, or the refresh was rejected).
async function getAccessToken(role, config) {
  const saved = loadTokens(role);
  if (!saved) return null;
  if (!isExpired(saved)) return saved.access_token;
  if (!saved.refresh_token) return null;

  if (!refreshing.has(role)) {
    const job = kick
      .refreshAccessToken({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        refreshToken: saved.refresh_token,
      })
      // Persist immediately — the old refresh token is dead the moment this returns.
      .then((fresh) => {
        const stored = saveTokens(fresh, role);
        log.info(`Refreshed ${role} access token`, { expires_in: stored.expires_in });
        return stored;
      })
      // Resolve to null rather than reject, so every waiter gets the same
      // answer and the failure is logged once instead of once per waiter.
      .catch((err) => {
        log.error(`Could not refresh ${role} token — log in again`, err.detail || { message: err.message });
        return null;
      })
      .finally(() => refreshing.delete(role));
    refreshing.set(role, job);
  }

  const fresh = await refreshing.get(role);
  return fresh?.access_token ?? null;
}

module.exports = { saveTokens, loadTokens, getAccessToken, isExpired };
