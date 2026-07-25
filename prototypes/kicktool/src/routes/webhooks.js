"use strict";

// POST /webhooks/kick — receives Kick webhooks, verifies the signature, logs
// the event, and (for chat messages) runs the echo bot.

const express = require("express");
const kick = require("../kick");
const tokens = require("../tokens");
const { publish } = require("./overlay");
const log = require("../logger");

module.exports = function webhooksRouter(config) {
  const router = express.Router();

  router.post("/webhooks/kick", async (req, res) => {
    const headers = {
      messageId: req.get("Kick-Event-Message-Id"),
      subscriptionId: req.get("Kick-Event-Subscription-Id"),
      signature: req.get("Kick-Event-Signature"),
      timestamp: req.get("Kick-Event-Message-Timestamp"),
      eventType: req.get("Kick-Event-Type"),
      eventVersion: req.get("Kick-Event-Version"),
    };

    const verified = await kick.verifyWebhookSignature({
      messageId: headers.messageId,
      timestamp: headers.timestamp,
      rawBody: req.rawBody || "",
      signatureBase64: headers.signature,
    });

    // EVENT level always prints, so every incoming webhook is visible.
    log.event(`Webhook received: ${headers.eventType || "unknown"} (verified: ${verified})`, {
      ...headers,
      body: req.body,
    });

    if (!verified) {
      log.warn("Webhook signature failed verification — ignoring payload");
      return res.status(401).send("invalid signature");
    }

    handleEvent(headers.eventType, req.body);
    res.status(200).send("ok");
  });

  // Route each event type to a handler. Chat messages get special treatment.
  function handleEvent(eventType, payload) {
    switch (eventType) {
      case "chat.message.sent": {
        const sender = payload?.sender?.username || payload?.sender?.slug || "unknown";
        const text = payload?.content ?? "";
        log.event(`💬 ${sender}: ${text}`);
        publish({ kind: "chat", user: sender, text });
        // Fire-and-forget so we still ack the webhook quickly.
        maybeEchoChat(payload).catch((err) => log.error("Echo failed", { message: err.message }));
        break;
      }
      case "channel.followed": {
        const follower = payload?.follower?.username || "someone";
        log.event(`➕ New follower: ${follower}`);
        publish({ kind: "follow", user: follower });
        break;
      }
      case "channel.subscription.new": {
        const subscriber = payload?.subscriber?.username || "someone";
        log.event(`⭐ New subscription: ${subscriber}`);
        publish({ kind: "sub", user: subscriber });
        break;
      }
      default:
        log.event(`Unhandled event type: ${eventType}`, payload);
    }
  }

  // Echo an incoming chat message back into the channel as the bot account.
  async function maybeEchoChat(payload) {
    if (!config.echoEnabled) return;

    // Send as the separate bot account (type:"user") into the channel the
    // message came from. Requires the bot to have logged in at /auth/login/bot
    // once — the access token is auto-refreshed from here on.
    const accessToken = await tokens.getAccessToken("bot", config);
    if (!accessToken) {
      log.warn("Cannot echo — bot not logged in. Visit /auth/login/bot (as the bot account).");
      return;
    }

    const senderName = payload?.sender?.username || payload?.sender?.slug || "someone";
    const text = (payload?.content ?? "").trim();
    const broadcasterUserId = payload?.broadcaster?.user_id;

    if (!text) return;
    // Loop guard: never echo the bot account's own messages, or it replies to
    // itself forever.
    if (senderName.toLowerCase() === config.botUsername.toLowerCase()) return;

    const reply = `Echo: ${text}`;
    try {
      await kick.sendChatMessage(accessToken, { content: reply, broadcasterUserId });
      log.event(`🤖 echoed → ${reply}`);
    } catch (err) {
      log.error("Failed to send echo chat message", err.detail || { message: err.message });
    }
  }

  return router;
};
