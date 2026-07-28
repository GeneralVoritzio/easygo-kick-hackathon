import { useEffect, useRef, useState } from "react";
import { createExplorerMessage, createExplorerMessages, type ExplorerMessage } from "./data";

const NEW_MESSAGE_MIN_MS = 1000;
const NEW_MESSAGE_MAX_MS = 3200;
const MAX_MESSAGES = 150;

/*
  The shared Explorer Chat for one expedition — unlike the main channel chat, this never resets
  when the current stop changes: it's the same room for the whole journey, only the video
  underneath it changes. `stageKey` is `'boarding'` or `stop-{index}`; whenever it changes, a
  system line narrates the arrival, keyed off the actual stop name. Ported from
  kick-web-redesign's useExplorerChat.ts.
*/
export function useExplorerChat(expeditionId: string, stageKey: string, stopName: string) {
  const [messages, setMessages] = useState<ExplorerMessage[]>(() => createExplorerMessages());
  const prevStageKey = useRef(stageKey);

  useEffect(() => {
    setMessages(createExplorerMessages());
    prevStageKey.current = stageKey;
    let timer: number | undefined;

    const scheduleNext = () => {
      const delay = NEW_MESSAGE_MIN_MS + Math.random() * (NEW_MESSAGE_MAX_MS - NEW_MESSAGE_MIN_MS);
      timer = window.setTimeout(() => {
        setMessages((prev) => [...prev.slice(-MAX_MESSAGES + 1), createExplorerMessage()]);
        scheduleNext();
      }, delay);
    };
    scheduleNext();

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expeditionId]);

  useEffect(() => {
    if (prevStageKey.current === stageKey || !stopName) return;
    prevStageKey.current = stageKey;
    setMessages((prev) => [
      ...prev.slice(-MAX_MESSAGES + 1),
      { id: `explorer-arrival-${Date.now()}`, username: "", text: `Now arriving at ${stopName}`, system: true },
    ]);
  }, [stageKey, stopName]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev.slice(-MAX_MESSAGES + 1), { id: `explorer-you-${Date.now()}`, username: "you", text: trimmed }]);
  };

  const sendSystemMessage = (text: string) => {
    setMessages((prev) => [
      ...prev.slice(-MAX_MESSAGES + 1),
      { id: `explorer-system-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, username: "", text, system: true },
    ]);
  };

  return { messages, sendMessage, sendSystemMessage };
}
