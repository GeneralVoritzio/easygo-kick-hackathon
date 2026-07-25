import { useEffect, useState } from 'react';
import type { ChatMessage } from '../types';
import { createMockChatMessage, createMockChatMessages } from '../mock/chat';

const NEW_MESSAGE_MIN_MS = 900;
const NEW_MESSAGE_MAX_MS = 2600;
const MAX_MESSAGES = 150;

/** Mock-only live chat, same "schedule the next fake event" shape used
 *  throughout these prototypes. Resets whenever `channelId` changes, since
 *  it's a fresh mount's worth of chat for whichever stream is now active. */
export function useLiveChat(channelId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => createMockChatMessages());

  useEffect(() => {
    setMessages(createMockChatMessages());
    let timer: number | undefined;

    const scheduleNext = () => {
      const delay = NEW_MESSAGE_MIN_MS + Math.random() * (NEW_MESSAGE_MAX_MS - NEW_MESSAGE_MIN_MS);
      timer = window.setTimeout(() => {
        setMessages((prev) => [...prev.slice(-MAX_MESSAGES + 1), createMockChatMessage()]);
        scheduleNext();
      }, delay);
    };
    scheduleNext();

    return () => window.clearTimeout(timer);
  }, [channelId]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev.slice(-MAX_MESSAGES + 1), { id: `chat-you-${Date.now()}`, viewerName: 'you', text: trimmed }]);
  };

  return { messages, sendMessage };
}
