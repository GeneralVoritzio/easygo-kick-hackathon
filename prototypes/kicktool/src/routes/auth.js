"use strict";

// OAuth 2.1 (PKCE) login flow: /auth/login and /auth/callback. PKCE + state
// generation and the authorize URL are built here (no network); the token
// exchange, user lookup and subscribe calls go through kick.js.

const crypto = require("crypto");
const express = require("express");
const kick = require("../kick");
const tokens = require("../tokens");
const log = require("../logger");

const ID_BASE = "https://id.kick.com"; // OAuth authorize endpoint

function base64url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function createPkce() {
  const verifier = base64url(crypto.randomBytes(32));
  const challenge = base64url(crypto.createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

function randomState() {
  return base64url(crypto.randomBytes(16));
}

function buildAuthorizeUrl({ clientId, redirectUri, scopes, state, codeChallenge }) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${ID_BASE}/oauth/authorize?${params.toString()}`;
}

// In-memory store of pending OAuth flows: state -> { codeVerifier, done, role }.
// ponytail: no TTL/eviction — a single-user local tool logs in a handful of
// times per process. Add pruning if this ever serves more than one person.
const pendingAuth = new Map();

module.exports = function authRouter(config) {
  const router = express.Router();

  // Step 1 — send the user to Kick to authorize. Log in as the streamer (default)
  // to receive webhooks, or as the bot to send chat. Authorize each while logged
  // into the matching Kick account in your browser.
  function startLogin(role, res) {
    const { verifier, challenge } = createPkce();
    const state = randomState();
    pendingAuth.set(state, { codeVerifier: verifier, done: false, role });

    const url = buildAuthorizeUrl({
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      scopes: config.scopes,
      state,
      codeChallenge: challenge,
    });

    log.info(`Starting OAuth flow (${role}), redirecting to Kick`, { state });
    res.redirect(url);
  }

  router.get("/auth/login", (_req, res) => startLogin("streamer", res));
  router.get("/auth/login/bot", (_req, res) => startLogin("bot", res));

  // Step 2 — Kick redirects back with a code; exchange it for tokens.
  router.get("/auth/callback", async (req, res) => {
    const { code, state, error, error_description: errorDescription } = req.query;

    if (error) {
      log.error("OAuth callback returned an error", { error, errorDescription });
      return res.status(400).send(`OAuth error: ${error} - ${errorDescription || ""}`);
    }

    const pending = state && pendingAuth.get(state);
    if (!pending) {
      log.warn("OAuth callback with unknown/expired state", { state });
      return res.status(400).send("Invalid or expired OAuth state. Try logging in again.");
    }
    if (pending.done) {
      // Browsers/proxies sometimes fire /auth/callback twice with the same state.
      // The first hit already completed the exchange, so just send them home.
      log.debug("Duplicate OAuth callback ignored", { state });
      return res.redirect("/");
    }
    pending.done = true; // consume before the await so a concurrent retry can't re-exchange
    const role = pending.role || "streamer";

    try {
      const newTokens = await kick.exchangeCodeForToken({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        redirectUri: config.redirectUri,
        code,
        codeVerifier: pending.codeVerifier,
      });
      tokens.saveTokens(newTokens, role);
      log.info(`OAuth successful (${role}) — access token obtained`, {
        scope: newTokens.scope,
        expires_in: newTokens.expires_in,
      });

      // Only the streamer owns the channel's webhook subscriptions; the bot just
      // sends chat, so it has nothing to subscribe to.
      if (role === "streamer") await autoSubscribe(newTokens.access_token);

      res.type("html").send(`
        <h1>✅ Authorized as ${role}!</h1>
        <p>Tokens saved.${role === "streamer" ? " The server will now log incoming webhooks." : " The bot can now send chat."}</p>
        <p><a href="/">Back home</a></p>
      `);
    } catch (err) {
      log.error("Failed to exchange authorization code", err.detail || { message: err.message });
      res.status(500).send("Token exchange failed. Check server logs.");
    }
  });

  return router;
};

// After auth, identify the user and subscribe to the events we care about.
async function autoSubscribe(accessToken) {
  try {
    const me = await kick.getCurrentUser(accessToken);
    const profile = me?.data?.[0] || me;
    log.info(`Authorized as Kick user: ${profile?.name || profile?.user_id || "unknown"}`);
  } catch (err) {
    log.warn("Could not fetch current user", err.detail || { message: err.message });
  }

  try {
    const result = await kick.subscribeToEvents(accessToken, [
      { name: "chat.message.sent", version: 1 },
      { name: "channel.followed", version: 1 },
      { name: "channel.subscription.new", version: 1 },
    ]);
    log.event("Subscribed to webhook events", result?.data?.map((e) => e.name) || result);
  } catch (err) {
    log.warn("Could not subscribe to events (is 'events:subscribe' scope granted?)", err.detail || {
      message: err.message,
    });
  }
}
