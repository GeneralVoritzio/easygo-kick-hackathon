"use strict";

// Self-check: `node check.js`. Covers the overlay bus/SSE stream and the token
// auto-refresh. Both stub the network and the token files — nothing here talks
// to Kick or touches tokens.json / tokens.bot.json.

const assert = require("assert");
const fs = require("fs");
const express = require("express");
const overlay = require("./src/routes/overlay");
const kick = require("./src/kick");
const tokens = require("./src/tokens");

const KEY = "test-key";
const CONFIG = { clientId: "id", clientSecret: "secret" };
const HOUR = 3600 * 1000;

async function checkOverlay() {
  const app = express();
  app.use(overlay({ overlayKey: KEY }));
  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}/overlays/stream`;

  assert.equal((await fetch(`${base}?key=wrong`)).status, 401, "bad key must be rejected");

  // Buffered chat is replayed; follows/subs are not (they'd re-pop on reload).
  for (let i = 0; i < 60; i++) overlay.publish({ kind: "chat", user: "u", text: `m${i}` });
  overlay.publish({ kind: "follow", user: "ghost" });

  const res = await fetch(`${base}?key=${KEY}`);
  assert.equal(res.status, 200);
  const reader = res.body.getReader();
  let seen = "";
  const pump = async (until) => {
    while (!until()) seen += new TextDecoder().decode((await reader.read()).value);
  };

  await pump(() => seen.includes("m59"));
  assert.ok(!seen.includes('m9"'), "ring buffer must drop past 50 messages");
  assert.ok(!seen.includes("ghost"), "follows must never be replayed");

  overlay.publish({ kind: "follow", user: "live" }); // live fan-out to the open stream
  await pump(() => seen.includes("live"));

  await reader.cancel();
  server.close();
}

function checkExpiry() {
  const now = Date.now();
  const base = { access_token: "a", expires_in: 7200, obtained_at: now - HOUR };
  assert.equal(tokens.isExpired(base, now), false, "1h into a 2h token is still valid");
  assert.equal(tokens.isExpired({ ...base, obtained_at: now - 3 * HOUR }, now), true, "past expiry");
  // The margin: 30s of validity left must count as expired, or a request can
  // start valid and arrive expired.
  assert.equal(tokens.isExpired({ ...base, obtained_at: now - (7200 - 30) * 1000 }, now), true, "margin");
  assert.equal(tokens.isExpired(null, now), true);
  assert.equal(tokens.isExpired({ access_token: "a" }, now), true, "unknown age = stale");
}

async function checkRefresh() {
  // Stub the bot token file in memory.
  let stored = { access_token: "old", refresh_token: "r1", expires_in: 7200, obtained_at: Date.now() - 3 * HOUR };
  const realRead = fs.readFileSync;
  const realWrite = fs.writeFileSync;
  const isBotFile = (p) => String(p).includes("tokens.bot.json");
  fs.readFileSync = (p, e) => (isBotFile(p) ? JSON.stringify(stored) : realRead(p, e));
  fs.writeFileSync = (p, d) => (isBotFile(p) ? (stored = JSON.parse(d)) : realWrite(p, d));

  let calls = 0;
  const realRefresh = kick.refreshAccessToken;
  kick.refreshAccessToken = async () => {
    calls++;
    await new Promise((r) => setTimeout(r, 20)); // overlap the concurrent callers
    return { access_token: `new${calls}`, refresh_token: `r${calls + 1}`, expires_in: 7200 };
  };

  try {
    // Three simultaneous echoes must trigger exactly ONE refresh — Kick rotates
    // the refresh token, so a second concurrent call would invalidate the first.
    const got = await Promise.all([
      tokens.getAccessToken("bot", CONFIG),
      tokens.getAccessToken("bot", CONFIG),
      tokens.getAccessToken("bot", CONFIG),
    ]);
    assert.equal(calls, 1, "concurrent refreshes must collapse to one");
    assert.deepEqual(got, ["new1", "new1", "new1"]);
    assert.equal(stored.refresh_token, "r2", "rotated refresh token must be persisted");
    assert.ok(stored.obtained_at, "obtained_at must be stamped, or the next check can't age it");

    // Still fresh — no second network call.
    assert.equal(await tokens.getAccessToken("bot", CONFIG), "new1");
    assert.equal(calls, 1, "a valid token must not be refreshed");

    // A rejected refresh means re-login, not a crash.
    stored.obtained_at = Date.now() - 3 * HOUR;
    kick.refreshAccessToken = async () => {
      const err = new Error("Token request failed (401)");
      err.detail = { error: "invalid_grant" };
      throw err;
    };
    assert.equal(await tokens.getAccessToken("bot", CONFIG), null, "failed refresh returns null");

    // No refresh token at all — also re-login.
    stored = { access_token: "x", expires_in: 7200, obtained_at: Date.now() - 3 * HOUR };
    assert.equal(await tokens.getAccessToken("bot", CONFIG), null);
  } finally {
    fs.readFileSync = realRead;
    fs.writeFileSync = realWrite;
    kick.refreshAccessToken = realRefresh;
  }
}

(async () => {
  await checkOverlay();
  checkExpiry();
  await checkRefresh();
  console.log("ok");
})();
