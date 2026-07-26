// Paste into javascript_tool, once on kick.com and once on the clone, at the same
// viewport. Save each result, then diff them with scripts/compare.mjs.
// Wrap it in (() => { ... })() so a repeated run does not clash on a declared name.

(() => {
  // Every selector must match on kick.com and on the clone, or the two runs
  // cannot be compared.
  const TARGETS = {
    navbar: "header, nav",
    sidebar: "#sidebar-wrapper, [class*='sidebar-expanded-width']",
    column: ".max-w-\\[125rem\\]",
    firstGrid: "section[class*='grid-cols']",
    firstCard: "section[class*='grid-cols'] > *",
  };

  const BOX = [
    "display", "gridTemplateColumns", "gridTemplateRows", "gap",
    "padding", "margin", "fontSize", "lineHeight", "fontWeight",
    "color", "backgroundColor", "borderRadius", "zIndex",
  ];

  const round = (n) => Math.round(n * 100) / 100;

  const read = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const box = {};
    for (const key of BOX) {
      const v = cs[key];
      if (v && v !== "normal" && v !== "none" && v !== "auto" && v !== "0px") box[key] = v;
    }
    return { rect: [round(r.width), round(r.height), round(r.x), round(r.y)], box };
  };

  const out = { viewport: [innerWidth, innerHeight], url: location.pathname };
  for (const [name, selector] of Object.entries(TARGETS)) {
    const el = document.querySelector(selector);
    out[name] = el ? read(el) : "not found";
  }
  return JSON.stringify(out, null, 1);
})();
