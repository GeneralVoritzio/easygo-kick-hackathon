// Chat overlay: a scrolling feed of recent messages.

const chat = document.getElementById("chat");
const MAX_MSGS = 40;

function addChat(evt) {
  const row = el("div", "msg");
  row.appendChild(el("span", "user", evt.user + ":"));
  row.appendChild(el("span", null, evt.text));
  chat.appendChild(row);
  requestAnimationFrame(() => row.classList.add("show"));
  while (chat.children.length > MAX_MSGS) chat.removeChild(chat.firstChild);
}

connectOverlay({ chat: addChat });
