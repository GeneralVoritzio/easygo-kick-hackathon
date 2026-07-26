// Distil the live page into a tree, in the page, so only the small result reaches you.
// Run through javascript_tool on a kick.com tab. kick.com answers 403 to any client
// that is not a real browser, so this is the only way to read a page.
// Set ROOT to narrow the capture. Identical sibling subtrees collapse to one.

(() => {
  const ROOT = "body";
  const MAX_DEPTH = 40;
  const KEEP = ["id", "data-testid", "data-state", "data-layout", "data-sidebar", "aria-label", "href", "type"];

  const skip = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "PATH", "G", "DEFS", "LINEARGRADIENT", "STOP", "CLIPPATH"]);

  const label = (el) => {
    const parts = [el.tagName.toLowerCase()];
    if (el.classList.length) parts.push(`.${[...el.classList].join(" .")}`);
    for (const key of KEEP) {
      const v = el.getAttribute(key);
      if (v) parts.push(`${key}="${v.slice(0, 100)}"`);
    }
    if (el.tagName === "SVG" || el.tagName === "svg") {
      const d = [...el.querySelectorAll("path")].map((p) => p.getAttribute("d") ?? "").join("").length;
      parts.push(`paths=${el.querySelectorAll("path").length} dlen=${d}`);
    }
    return parts.join(" ");
  };

  const serialise = (el, depth) => {
    const pad = "  ".repeat(depth);
    if (depth >= MAX_DEPTH) return `${pad}${label(el)} ...`;
    const kids = [];
    for (const child of el.children) {
      if (skip.has(child.tagName.toUpperCase())) continue;
      const body = serialise(child, depth + 1);
      const last = kids[kids.length - 1];
      if (last && last.body === body) last.count += 1;
      else kids.push({ body, count: 1 });
    }
    const own = el.children.length === 0 ? (el.textContent ?? "").trim().slice(0, 60) : "";
    const head = own ? `${pad}${label(el)}  "${own}"` : `${pad}${label(el)}`;
    if (!kids.length) return head;
    const body = kids
      .map((k) => (k.count > 1 ? `${k.body}\n${pad}  ... and ${k.count - 1} more like it` : k.body))
      .join("\n");
    return `${head}\n${body}`;
  };

  const root = document.querySelector(ROOT);
  const sheets = [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.href);
  const tree = root ? serialise(root, 0) : `no element matches ${ROOT}`;

  return [
    `url        ${location.href}`,
    `viewport   ${innerWidth} by ${innerHeight}`,
    `sheets     ${sheets.join("\n           ")}`,
    "",
    tree,
  ].join("\n");
})();
