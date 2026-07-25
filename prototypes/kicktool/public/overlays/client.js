// Shared overlay runtime. Each overlay page calls connectOverlay() with only
// the event kinds it wants to render; everything else is ignored (the per-page
// filter). The secret key comes from this page's own URL (?key=...), the same
// URL you paste into OBS.

/* exported connectOverlay, el */

// Create an element with a class and safe text (textContent — never innerHTML,
// since chat/usernames are attacker-controlled).
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function connectOverlay(handlers) {
  const key = new URLSearchParams(location.search).get("key") || "";
  // Absolute path so it works from any overlay folder (e.g. /overlays/chat/).
  const es = new EventSource("/overlays/stream?key=" + encodeURIComponent(key));
  es.onmessage = (e) => {
    let evt;
    try {
      evt = JSON.parse(e.data);
    } catch {
      return;
    }
    const handler = handlers[evt.kind];
    if (handler) handler(evt);
  };
  // EventSource auto-reconnects on its own; nothing else needed.
  return es;
}
