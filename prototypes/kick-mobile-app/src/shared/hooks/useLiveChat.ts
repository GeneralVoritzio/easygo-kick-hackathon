import { useEffect, useState } from 'react';
import type { ChatMessage } from '../types';
import { createMockChatMessage, createMockChatMessages } from '../mock/mockData';

const NEW_MESSAGE_MIN_MS = 900;
const NEW_MESSAGE_MAX_MS = 2600;
const MAX_MESSAGES = 150;

interface UseLiveChatResult {
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
}

/**
 * Mock-only live chat for the Stream View — no backend contract yet, same
 * "schedule the next fake event" shape as useBounties. `sendMessage` appends
 * locally as `viewerName: 'you'`; there's nowhere else for it to go.
 */
export function useLiveChat(): UseLiveChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>(() => createMockChatMessages());

  useEffect(() => {
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
  }, []);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev.slice(-MAX_MESSAGES + 1),
      { id: `chat-you-${Date.now()}`, viewerName: 'you', text: trimmed, createdAt: new Date().toISOString() },
    ]);
  };

  return { messages, sendMessage };
}
