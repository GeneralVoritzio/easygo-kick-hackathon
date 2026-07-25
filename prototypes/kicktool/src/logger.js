"use strict";

// Tiny logger: timestamp, level tag, message, optional JSON detail. All stdout.
// Set LOG_LEVEL (debug|info|warn|error) to filter — anything below it is dropped.
// EVENT is unranked and always shown (webhooks/chat are the point of this tool).

const { styleText } = require("util");

const COLOR = { DEBUG: "gray", INFO: "green", WARN: "yellow", ERROR: "red", EVENT: "cyan" };
const RANK = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const MIN = RANK[(process.env.LOG_LEVEL || "info").toUpperCase()] ?? RANK.INFO;

function write(level, msg, detail) {
  if (level in RANK && RANK[level] < MIN) return;
  let line = `${styleText("gray", new Date().toISOString())} ${styleText(COLOR[level], level.padEnd(5))} ${msg}`;
  if (detail !== undefined) {
    line += "\n" + styleText("gray", typeof detail === "string" ? detail : JSON.stringify(detail, null, 2));
  }
  console.log(line);
}

module.exports = {
  debug: (msg, detail) => write("DEBUG", msg, detail),
  info: (msg, detail) => write("INFO", msg, detail),
  warn: (msg, detail) => write("WARN", msg, detail),
  error: (msg, detail) => write("ERROR", msg, detail),
  event: (msg, detail) => write("EVENT", msg, detail),
};
