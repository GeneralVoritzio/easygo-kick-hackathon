"use strict";

// The overlay data feed: a key-gated Server-Sent Events stream that the static
// overlay pages (public/overlays/*/index.html) subscribe to. webhooks.js calls
// publish() below; the pages themselves are plain static files served by
// express.static in main.js.

const { EventEmitter } = require("events");
const express = require("express");

const emitter = new EventEmitter();
emitter.setMaxListeners(0); // one listener per open overlay; cleaned up on disconnect

// Recent CHAT only, so a freshly opened overlay isn't blank. Follows/subs are
// deliberately not buffered — replaying them re-fires alert pop-ups on reload.
const CHAT_BUFFER = 50;
const recentChat = [];

function publish(evt) {
  if (evt.kind === "chat") {
    recentChat.push(evt);
    if (recentChat.length > CHAT_BUFFER) recentChat.shift();
  }
  emitter.emit("event", evt);
}

module.exports = function overlayRouter(config) {
  const router = express.Router();

  router.get("/overlays/stream", (req, res) => {
    if (!req.query.key || req.query.key !== config.overlayKey) {
      return res.status(401).send("unauthorized");
    }

    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // tell nginx-family proxies not to buffer
    });
    res.flushHeaders();
    res.write(": connected\n\n");

    const send = (evt) => res.write(`data: ${JSON.stringify(evt)}\n\n`);
    for (const evt of recentChat) send(evt); // replay so the page isn't blank
    emitter.on("event", send);

    const hb = setInterval(() => res.write(": ping\n\n"), 25000); // under proxy idle timeouts

    req.on("close", () => {
      clearInterval(hb);
      emitter.off("event", send);
    });
  });

  return router;
};

module.exports.publish = publish;
