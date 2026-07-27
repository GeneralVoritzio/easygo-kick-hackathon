// Diff two runs of in-page/measure.js and print only what differs.
// Usage: node compare.mjs <kick.json> <clone.json>
//
// Two jobs, one script:
//   kick.json  vs  clone.json   does our copy match the real page
//   kick.json  vs  kick-old.json  has kick.com changed since we captured it

import { readFile } from "node:fs/promises";

const [left, right] = process.argv.slice(2);
if (!left || !right) {
  console.error("Usage: node compare.mjs <a.json> <b.json>");
  process.exit(1);
}

const load = async (p) => JSON.parse(await readFile(p, "utf8"));
const a = await load(left);
const b = await load(right);

const META = new Set(["viewport", "url", "captured", "source", "loggedIn"]);
const names = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => !META.has(k));

if (String(a.viewport) !== String(b.viewport)) {
  console.log(`WARNING: different viewports, ${a.viewport} against ${b.viewport}.`);
  console.log("         Measure both at the same size or every number below is noise.\n");
}

let faults = 0;

for (const name of names) {
  const x = a[name];
  const y = b[name];
  const notes = [];

  const gone = (v) => !v || typeof v === "string";

  if (gone(x) && gone(y)) {
    notes.push("  found in neither file. The selector does not fit this page, so nothing was checked.");
  } else if (gone(x) || gone(y)) {
    notes.push(`  found in ${gone(x) ? right : left} only`);
  } else {
    const [aw, ah] = x.rect;
    const [bw, bh] = y.rect;
    if (aw !== bw || ah !== bh) notes.push(`  ${"size".padEnd(20)} ${aw} by ${ah}   against   ${bw} by ${bh}`);
    const keys = [...new Set([...Object.keys(x.box), ...Object.keys(y.box)])];
    for (const key of keys) {
      if (x.box[key] !== y.box[key]) {
        notes.push(`  ${key.padEnd(20)} ${x.box[key] ?? "unset"}   against   ${y.box[key] ?? "unset"}`);
      }
    }
  }

  if (notes.length) {
    faults += 1;
    console.log(name);
    console.log(notes.join("\n"));
    console.log("");
  }
}

console.log(faults === 0 ? "No difference." : `${faults} of ${names.length} targets differ.`);
console.log(`left  ${left}\nright ${right}`);
process.exit(faults === 0 ? 0 : 1);
