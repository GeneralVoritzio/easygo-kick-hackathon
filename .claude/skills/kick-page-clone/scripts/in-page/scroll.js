// Scroll a kick.com page to the bottom, then back to the top, and report what appeared.
// Run through javascript_tool before tree.js, source.js or a screenshot.
//
// KICK loads rows as you reach them, and body is overflow:hidden, so the page does
// not scroll as one document. A capture taken at the top holds the first screen only.

(async () => {
  const STEPS = 40;
  const WAIT = 600;

  const candidates = [document.scrollingElement, ...document.querySelectorAll("main, div")];
  const scroller = candidates
    .filter(Boolean)
    .map((el) => ({ el, over: el.scrollHeight - el.clientHeight }))
    .sort((a, b) => b.over - a.over)[0].el;

  const before = scroller.scrollHeight;
  let last = -1;
  for (let i = 0; i < STEPS && scroller.scrollHeight !== last; i += 1) {
    last = scroller.scrollHeight;
    scroller.scrollTo(0, scroller.scrollHeight);
    await new Promise((r) => setTimeout(r, WAIT));
  }
  scroller.scrollTo(0, 0);

  const sections = [...document.querySelectorAll("section")].map((s) => ({
    title: s.querySelector("h1, h2, h3")?.textContent?.trim().slice(0, 40) ?? "untitled",
    links: s.querySelectorAll("a[href]").length,
  }));

  return JSON.stringify({
    scroller: scroller.tagName.toLowerCase() + (scroller.className ? `.${String(scroller.className).split(" ")[0]}` : ""),
    heightBefore: before,
    heightAfter: scroller.scrollHeight,
    sections,
    images: document.querySelectorAll("img[src]").length,
  }, null, 1);
})();
