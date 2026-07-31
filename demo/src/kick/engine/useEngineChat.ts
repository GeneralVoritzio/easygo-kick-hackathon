import { useState } from "react";
import type { BadgeName } from "./chat";
import { useEngine, useEngineEvents } from "./EngineProvider";
import type { ChatMessageSent } from "./events";

// A chat panel keeps only the last messages on screen, the same way KICK trims the room.
const SCROLLBACK_LIMIT = 150;

export type EngineChatMessage = {
  id: number;
  username: string;
  badges: BadgeName[];
  color: string;
  body: string;
};

let nextId = 1;

// A panel also shows what the viewer just sent, so both sources take an id from here.
export const nextChatId = () => nextId++;

export function toChatMessage(payload: ChatMessageSent): EngineChatMessage {
  return {
    id: nextChatId(),
    username: payload.sender.username,
    badges: payload.sender.identity.badges.map((badge) => badge.type),
    color: payload.sender.identity.username_color,
    body: payload.content,
  };
}

export function useEngineChat(scrollback: number) {
  const engine = useEngine();
  const [messages, setMessages] = useState<EngineChatMessage[]>(() =>
    engine.seedChat(scrollback).map(toChatMessage),
  );

  useEngineEvents((event) => {
    if (event.name !== "kick chat.message.sent") return;
    setMessages((prev) => [...prev.slice(-(SCROLLBACK_LIMIT - 1)), toChatMessage(event.payload)]);
  });

  return [messages, setMessages] as const;
}
