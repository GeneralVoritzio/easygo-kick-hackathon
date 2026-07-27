// Rebuild demo/src/kick/icons.ts from demo/src/kick/icons/.
// Run it after you add an icon you read off kick.com.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = "demo/src/kick/icons";
const out = "demo/src/kick/icons.ts";

const entries = readdirSync(dir)
  .filter((f) => f.endsWith(".svg"))
  .sort()
  .map((file) => {
    const svg = readFileSync(join(dir, file), "utf8").trim();
    const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 32 32";
    const path = svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
    const name = file.replace(/\.svg$/, "");
    return `  ${JSON.stringify(name)}: { viewBox: ${JSON.stringify(viewBox)}, path: ${JSON.stringify(path)} },`;
  });

writeFileSync(
  out,
  [
    "export const kickIcons = {",
    ...entries,
    "} as const;",
    "",
    "export type KickIconName = keyof typeof kickIcons;",
    "",
  ].join("\n"),
);

console.log(`${entries.length} icons written to ${out}`);
