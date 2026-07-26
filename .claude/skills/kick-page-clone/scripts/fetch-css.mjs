// Download KICK's CSS chunks into demo/kick-reference/css/.
// Usage: node fetch-css.mjs <url> [url...] [--out demo/kick-reference/css]
//
// kick.com answers 403 to any client that is not a real browser, so the page HTML
// has to come from the browser. assets.kick.com is open, so the CSS does not.
// Get the URLs from scripts/in-page/tree.js, which prints them.

import { writeFile, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";

const args = process.argv.slice(2);
let outDir = "demo/kick-reference/css";
const urls = [];
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--out") outDir = args[++i];
  else urls.push(args[i]);
}

if (!urls.length) {
  console.error("Usage: node fetch-css.mjs <url> [url...] [--out dir]");
  process.exit(1);
}

await mkdir(outDir, { recursive: true });
const held = new Set(await readdir(outDir).catch(() => []));

for (const url of urls) {
  const file = url.split("/").pop().split("?")[0];
  if (held.has(file)) {
    console.log(`have   ${file}`);
    continue;
  }
  const res = await fetch(url);
  const body = await res.text();
  if (res.status !== 200 || !body.includes("{")) {
    console.log(`fail   ${res.status}  ${url}`);
    continue;
  }
  await writeFile(join(outDir, file), body);
  held.add(file);
  console.log(`saved  ${(body.length / 1024).toFixed(0)} KB  ${file}`);
}

console.log(`\n${held.size} chunks held in ${outDir}`);
console.log("Every class you see in a tree resolves in these files. Match one, do not guess a value.");
