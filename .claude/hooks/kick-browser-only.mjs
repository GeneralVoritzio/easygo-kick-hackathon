// Block every attempt to read kick.com without a browser.
// Wired to PreToolUse in .claude/settings.json. Exit 2 stops the call and shows
// the message to Claude.
//
// assets.kick.com stays open, because it serves the CSS chunks and answers a
// plain request. Only kick.com itself needs the browser.

import { readFileSync } from "node:fs";

let event;
try {
  event = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}

const input = event.tool_input ?? {};
const subject = [input.command, input.url, input.file_path].filter(Boolean).join(" ");
if (!subject) process.exit(0);

const urls = subject.match(/https?:\/\/[^\s'"`)\\]+/g) ?? [];
const hosts = urls
  .map((u) => {
    try {
      return new URL(u).hostname.toLowerCase();
    } catch {
      return "";
    }
  })
  .filter((h) => h === "kick.com" || h.endsWith(".kick.com"));

if (hosts.length === 0) process.exit(0);
if (hosts.every((h) => h === "assets.kick.com")) process.exit(0);

const target = [...new Set(hosts)].join(", ");

console.error(
  [
    `Blocked. ${target} does not answer a request that is not a real browser.`,
    "",
    "It returns 403 to curl, to Node and to WebFetch, and a logged out page",
    "returns skeleton placeholders instead of cards.",
    "",
    "Read it in the user's own Chrome, where their session is already open:",
    "  mcp__claude-in-chrome__navigate      open the page",
    "  mcp__claude-in-chrome__javascript_tool  run the in-page scripts",
    "",
    "The scripts are in .claude/skills/kick-page-clone/scripts/in-page/:",
    "  tree.js    find the part you want",
    "  source.js  take its real outerHTML",
    "  css.js     resolve every class it uses",
    "  measure.js geometry, for the drift check",
    "",
    "assets.kick.com is open, so fetch-css.mjs may still download the CSS chunks.",
  ].join("\n"),
);
process.exit(2);
