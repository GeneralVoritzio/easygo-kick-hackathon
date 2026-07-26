// Resolve KICK's own class names to their real declarations, in the page.
// Run through javascript_tool on a kick.com tab. Put the classes you need in NAMES.
//
// This is how you learn that grid-cols-auto-fill-category is
// repeat(auto-fill, minmax(139px, 1fr)), and that z-navbar is 301.
// Never estimate a value you can read.

(() => {
  // Name the classes you care about, or set FROM to a selector and take every
  // class its subtree uses. FROM wins when both are set.
  const NAMES = ["grid-cols-auto-fill-category", "z-navbar", "state-layer-base"];
  const FROM = "";

  if (FROM) {
    const root = document.querySelector(FROM);
    if (!root) return `no element matches ${FROM}`;
    const found = new Set();
    for (const el of [root, ...root.querySelectorAll("*")]) {
      for (const c of el.classList) found.add(c);
    }
    NAMES.length = 0;
    NAMES.push(...found);
  }

  // A probe beats reading the stylesheet, because KICK serves its CSS from
  // assets.kick.com, and a cross origin sheet will not hand over its rules.
  const base = document.createElement("div");
  const probe = document.createElement("div");
  document.body.append(base, probe);

  const diff = (pseudo) => {
    const a = getComputedStyle(base, pseudo);
    const b = getComputedStyle(probe, pseudo);
    const out = [];
    for (const prop of b) {
      const value = b.getPropertyValue(prop);
      if (a.getPropertyValue(prop) !== value) out.push(`${prop}: ${value}`);
    }
    return out;
  };

  const lines = [];
  const quiet = [];
  for (const name of NAMES) {
    probe.className = name;
    const own = diff(null);
    const after = diff("::after");
    const before = diff("::before");
    if (!own.length && !after.length && !before.length) {
      quiet.push(name);
      continue;
    }
    lines.push(name);
    if (own.length) lines.push(`  ${own.join("; ")}`);
    if (after.length) lines.push(`  ::after  ${after.join("; ")}`);
    if (before.length) lines.push(`  ::before ${before.join("; ")}`);
  }
  base.remove();
  probe.remove();

  // A class that only works behind a variant, a state or a parent selector shows
  // nothing on a bare div. That is not a fault, it is how the class is built.
  if (quiet.length) lines.push("", `no effect on a bare div: ${quiet.join(" ")}`);

  // Then the rules, for anything the probe could not show. Skipped when FROM
  // gathered hundreds of names, because the output stops being readable.
  const blocked = [];
  const rules = [];
  for (const sheet of NAMES.length > 40 ? [] : document.styleSheets) {
    let list;
    try {
      list = sheet.cssRules;
    } catch {
      blocked.push(sheet.href);
      continue;
    }
    const walk = (items, context) => {
      for (const rule of items) {
        if (rule.cssRules) {
          walk(rule.cssRules, rule.conditionText ? `@media ${rule.conditionText}` : context);
          continue;
        }
        if (!rule.selectorText) continue;
        if (NAMES.some((n) => rule.selectorText.includes(n))) {
          rules.push(`${context ? `${context} ` : ""}${rule.selectorText} { ${rule.style.cssText} }`);
        }
      }
    };
    walk(list, "");
  }

  if (rules.length) lines.push("", "matching rules", ...rules.map((r) => `  ${r}`));

  const sheets = [...document.styleSheets].map((s) => s.href).filter(Boolean);
  if (blocked.length || NAMES.length > 40) {
    lines.push(
      "",
      "KICK serves its CSS from another host, so a stylesheet will not hand over its rules here.",
      "The probe above reads through that. To hold the files as well:",
      `  node .claude/skills/kick-page-clone/scripts/fetch-css.mjs ${sheets.join(" ")}`,
    );
  }

  return lines.join("\n");
})();
