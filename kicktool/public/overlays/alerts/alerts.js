// Alerts overlay: pop-up notifications for new followers and subscriptions.

const alerts = document.getElementById("alerts");
const HOLD_MS = 6000;

function popAlert(kind, message) {
  const node = el("div", "alert " + kind, message);
  alerts.appendChild(node);
  requestAnimationFrame(() => node.classList.add("show"));
  setTimeout(() => {
    node.classList.remove("show");
    setTimeout(() => node.remove(), 300);
  }, HOLD_MS);
}

connectOverlay({
  follow: (evt) => popAlert("follow", "➕ " + evt.user + " followed!"),
  sub: (evt) => popAlert("sub", "⭐ " + evt.user + " subscribed!"),
});
