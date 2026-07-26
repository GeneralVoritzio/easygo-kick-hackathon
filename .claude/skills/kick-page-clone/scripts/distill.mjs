// Turn a saved kick.com page into a readable tree, and pull out its inline SVGs.
// Identical sibling subtrees collapse to one, so a grid of 50 cards reads as one card.
// Usage: node distill.mjs <html-file> [--icons demo/kick-reference/icons]

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { basename, dirname, join } from "node:path";

const args = process.argv.slice(2);
let iconDir = null;
const rest = [];
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--icons") iconDir = args[++i];
  else rest.push(args[i]);
}

const file = rest[0];
if (!file) {
  console.error("Usage: node distill.mjs <html-file> [--icons dir]");
  process.exit(1);
}

iconDir ??= join(dirname(dirname(file)), "icons");
const outFile = join(dirname(dirname(file)), "trees", basename(file).replace(/\.html?$/, ".md"));

const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

const SKIP = new Set(["script", "style", "head", "noscript"]);
const KEEP = ["id", "data-testid", "data-state", "data-layout", "data-sidebar", "aria-label", "href"];

const html = await readFile(file, "utf8");

const icons = new Map();
const withoutIcons = html.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/g, (svg) => {
  const paths = [...svg.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]).join("|");
  const key = createHash("sha1").update(paths || svg).digest("hex").slice(0, 8);
  if (!icons.has(key)) icons.set(key, svg);
  return `<svg-${key}></svg-${key}>`;
});

const unescape = (s) => s.replace(/&amp;/g, "&").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&#x27;/g, "'");

function label(tag, raw) {
  const parts = [tag];
  const cls = raw.match(/\sclass="([^"]*)"/);
  if (cls) parts.push(`.${unescape(cls[1]).split(/\s+/).filter(Boolean).join(" .")}`);
  for (const key of KEEP) {
    const m = raw.match(new RegExp(`\\s${key}="([^"]*)"`));
    if (m) parts.push(`${key}="${unescape(m[1]).slice(0, 100)}"`);
  }
  return parts.join(" ");
}

const root = { text: "root", children: [] };
const stack = [root];
const body = withoutIcons.slice(Math.max(0, withoutIcons.indexOf("<body")));

for (const m of body.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*?)(\/?)>/g)) {
  const [raw, close, tagRaw, , selfClose] = m;
  const tag = tagRaw.toLowerCase();
  if (SKIP.has(tag)) continue;
  if (close) {
    if (stack.length > 1) stack.pop();
    continue;
  }
  const node = { text: tag.startsWith("svg-") ? `svg :${tag.slice(4)}` : label(tag, raw), children: [] };
  stack[stack.length - 1].children.push(node);
  if (!VOID.has(tag) && !selfClose) stack.push(node);
}

function serialise(node, depth) {
  const pad = "  ".repeat(depth);
  const kids = [];
  for (const child of node.children) {
    const body = serialise(child, depth + 1);
    const last = kids[kids.length - 1];
    if (last && last.body === body) last.count += 1;
    else kids.push({ body, count: 1 });
  }
  const rendered = kids
    .map((k) => (k.count > 1 ? `${k.body}\n${pad}  ... and ${k.count - 1} more like it` : k.body))
    .join("\n");
  return rendered ? `${pad}${node.text}\n${rendered}` : `${pad}${node.text}`;
}

const tree = root.children.map((c) => serialise(c, 0)).join("\n");
const lines = tree.split("\n").length;

await mkdir(dirname(outFile), { recursive: true });
await writeFile(outFile, `# ${basename(file)}\n\n\`\`\`\n${tree}\n\`\`\`\n`);

await mkdir(iconDir, { recursive: true });
let written = 0;
for (const [key, svg] of icons) {
  await writeFile(join(iconDir, `icon-${key}.svg`), svg, { flag: "wx" }).then(
    () => (written += 1),
    () => {},
  );
}

console.log(`tree   ${lines} lines  ${outFile}`);
console.log(`icons  ${icons.size} unique, ${written} new  ${iconDir}`);
console.log("\nName each icon from the aria-label of the button that holds it. Never draw one.");
