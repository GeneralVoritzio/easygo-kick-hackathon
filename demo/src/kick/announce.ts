// fake-kick POST /public/v1/livestreams/{broadcaster_user_id}/announcements. A streamer-only
// system line, dropped into the chat feed the same way a real KICK announcement would land for
// every viewer watching. Broadcast over a window event, the same wiring prefs.ts already uses,
// so the dashboard button never has to reach into ChatFeed's own message state.
const EVENT = "kick-chat-announce";

export function announceInChat(body: string) {
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: body }));
}

export function onChatAnnounce(handler: (body: string) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<string>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
