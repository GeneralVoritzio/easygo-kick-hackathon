// Take the real source of one part of a kick.com page, from the page.
// Run through javascript_tool on a kick.com tab in Claude in Chrome.
// This is the markup you port. The tree tells you where a thing is, this gives
// you the thing itself, including the inline styles a tree leaves out.
//
// Set SELECTOR. Keep it tight. A whole page is 700 KB, a navbar is 6 KB.

(() => {
  const SELECTOR = "nav";
  const KEEP_SVG = false; // true writes every icon out in full, which is large
  const LIMIT = 60_000;

  const el = document.querySelector(SELECTOR);
  if (!el) return `no element matches ${SELECTOR}`;

  let html = el.outerHTML;
  const icons = (html.match(/<svg\b/g) ?? []).length;
  if (!KEEP_SVG) {
    let n = 0;
    html = html.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/g, () => `<svg data-icon="${n++}"/>`);
  }

  const pretty = html
    .replace(/></g, ">\n<")
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  const head = [
    `selector   ${SELECTOR}`,
    `url        ${location.href}`,
    `viewport   ${innerWidth} by ${innerHeight}`,
    `size       ${(pretty.length / 1024).toFixed(1)} KB`,
    `icons      ${icons}${KEEP_SVG ? "" : ", replaced by placeholders. Read each one separately"}`,
    "",
  ].join("\n");

  if (pretty.length > LIMIT) {
    return `${head}Too large. Narrow SELECTOR, or raise LIMIT on purpose.`;
  }
  return head + pretty;
})();
