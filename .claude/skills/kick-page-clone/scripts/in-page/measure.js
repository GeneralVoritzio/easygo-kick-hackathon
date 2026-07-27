// Paste into javascript_tool, once on kick.com and once on the clone, at the same
// viewport, with both scrolled to the top. Save each result, then diff them with
// scripts/compare.mjs.
// Wrap it in (() => { ... })() so a repeated run does not clash on a declared name.
//
// javascript_tool truncates a reply at about 1000 characters, and a truncated
// measurement is worse than none. Keep the result in the page, then read it in
// parts:
//   window.__r = <this script>;  window.__r.length
//   window.__r.slice(0, 900)     window.__r.slice(900, 1800)   ...
// Join the parts in the order you read them, and check the length matches.

(() => {
  // The page frame. Every selector must match on kick.com and on the clone, or
  // the two runs cannot be compared. Add the ones your page needs.
  const TARGETS = {
    navbar: "header, nav",
    sidebar: "#sidebar-wrapper, [class*='sidebar-expanded-width']",
    column: ".max-w-\\[125rem\\]",
    firstGrid: "section[class*='grid-cols']",
    firstCard: "section[class*='grid-cols'] > *",
  };

  // KICK names its components with data-testid, and we copy those names, so both
  // sides carry the same ones. This measures the parts the frame above does not
  // describe, without a hand written selector for every page.
  const MAX_TESTIDS = 12;

  const BOX = [
    "display", "gridTemplateColumns", "gridTemplateRows", "gap",
    "padding", "margin", "fontSize", "lineHeight", "fontWeight",
    "color", "backgroundColor", "backgroundImage", "borderRadius", "zIndex",
    "borderWidth", "borderColor", "borderStyle", "boxShadow",
    "opacity", "mixBlendMode", "filter", "backdropFilter", "objectFit",
  ];

  const round = (n) => Math.round(n * 100) / 100;

  // Tailwind preflight puts a border colour and a border style on every element,
  // so those two mean nothing without a width. Drop the defaults, or each element
  // reports six values that can never differ.
  const DEFAULT = { opacity: "1", objectFit: "fill", filter: "none", mixBlendMode: "normal" };

  // Report what differs from the page default, because javascript_tool truncates a
  // long reply. The body target below keeps the defaults themselves, so a page that
  // sets the wrong font or the wrong text colour still shows.
  const INHERITED = ["fontSize", "lineHeight", "fontWeight", "color"];
  const bodyStyle = getComputedStyle(document.body);

  const read = (el, keepDefaults = false) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const box = {};
    for (const key of BOX) {
      const v = cs[key];
      if (!v || v === "normal" || v === "none" || v === "auto" || v === "0px") continue;
      if (DEFAULT[key] === v) continue;
      if (!keepDefaults) {
        if (INHERITED.includes(key) && v === bodyStyle[key]) continue;
        if (key === "backgroundColor" && v === "rgba(0, 0, 0, 0)") continue;
      }
      box[key] = v;
    }
    if (!box.borderWidth) {
      delete box.borderColor;
      delete box.borderStyle;
    }
    return { rect: [round(r.width), round(r.height), round(r.x), round(r.y)], box };
  };

  const out = { viewport: [innerWidth, innerHeight], url: location.pathname };
  out.body = read(document.body, true);
  for (const [name, selector] of Object.entries(TARGETS)) {
    const el = document.querySelector(selector);
    out[name] = el ? read(el) : "not found";
  }

  const seen = new Set();
  const named = [];
  for (const el of document.querySelectorAll("[data-testid]")) {
    const id = el.getAttribute("data-testid");
    if (seen.has(id)) continue;
    seen.add(id);
    named.push(el);
  }

  // Spread the sample across the page. The first elements in the document are the
  // navbar and the sidebar on every page, so taking the first ones measures the
  // chrome again and never reaches the content.
  const step = Math.max(1, Math.ceil(named.length / MAX_TESTIDS));
  for (let i = 0; i < named.length; i += step) {
    out[`testid:${named[i].getAttribute("data-testid")}`] = read(named[i]);
  }

  // Compact, because javascript_tool truncates a long reply and a truncated
  // measurement is worse than none. Format it when you save it.
  return JSON.stringify(out);
})();
