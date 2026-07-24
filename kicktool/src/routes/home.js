"use strict";

// GET / — status page with login + subscription links.

const express = require("express");
const tokens = require("../tokens");

module.exports = function homeRouter(config) {
  const router = express.Router();

  router.get("/", (_req, res) => {
    const streamer = tokens.loadTokens("streamer");
    const bot = tokens.loadTokens("bot");
    res.type("html").send(`
      <h1>Kick Tool</h1>
      <p>Streamer (receives chat): ${streamer ? "✅ authorized" : "⚠️ not authorized"}</p>
      <p>Bot (sends chat): ${bot ? "✅ authorized" : "⚠️ not authorized"}</p>
      <ul>
        <li><a href="/auth/login">Log in as streamer</a> (do this in your streamer account)</li>
        <li><a href="/auth/login/bot">Log in as bot</a> (do this in your bot account)</li>
      </ul>
      <p>Webhook endpoint: <code>${config.publicUrl}/webhooks/kick</code></p>
      <p>OBS overlays:</p>
      <ul>
        <li>Chat: <code>${config.publicUrl}/overlays/chat/?key=${config.overlayKey}</code></li>
        <li>Alerts: <code>${config.publicUrl}/overlays/alerts/?key=${config.overlayKey}</code></li>
      </ul>
    `);
  });

  return router;
};
