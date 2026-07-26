// Resolve KICK's own class names to their real declarations, in the page.
// Run through javascript_tool on a kick.com tab. Put the classes you need in NAMES.
//
// This is how you learn that grid-cols-auto-fill-category is
// repeat(auto-fill, minmax(139px, 1fr)), and that z-navbar is 301.
// Never estimate a value you can read.

(() => {
  const NAMES = ["grid-cols-auto-fill-category", "z-navbar", "state-layer-base"];

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
  for (const name of NAMES) {
    probe.className = name;
    const own = diff(null);
    const after = diff("::after");
    const before = diff("::before");
    lines.push(`${name}`);
    lines.push(`  ${own.length ? own.join("; ") : "nothing on the element itself"}`);
    if (after.length) lines.push(`  ::after  ${after.join("; ")}`);
    if (before.length) lines.push(`  ::before ${before.join("; ")}`);
  }
  base.remove();
  probe.remove();

  // A class that only exists behind a variant, a state or a parent selector shows
  // nothing on a bare div. Fall back to the rules, and then to the files.
  const blocked = [];
  const rules = [];
  for (const sheet of document.styleSheets) {
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
  if (blocked.length) {
    lines.push(
      "",
      `${blocked.length} sheets are cross origin, so their rules are closed here.`,
      "Download them, which works, because assets.kick.com is open:",
      `  node .claude/skills/kick-page-clone/scripts/fetch-css.mjs ${blocked.join(" ")}`,
    );
  }

  return lines.join("\n");
})();
