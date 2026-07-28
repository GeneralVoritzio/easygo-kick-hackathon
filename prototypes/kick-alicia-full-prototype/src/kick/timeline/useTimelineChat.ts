import { useEffect, useRef, useState } from "react";
import { currentUser } from "../mock/api";
import { chatHypeLines, chatLines, chatters, colorFor } from "../mock/chatIdentities";
import type { ChatDriver, Message } from "../components/ChannelChat";
import { BUCKET_SECONDS, type Timeline } from "./data";

/*
  Chat follows the playhead. Rewind the stream and chat rewinds with it: every kick
  chat.message.sent event carries a timestamp against started_at, so a recorder can replay the
  room as it was. Ported from kick-timeline-with-recap/js/chat.js.
*/

const MAX_ROWS = 120;
const SEEK_GAP_SECONDS = 5;
const FILL_ROWS = 20;

let seq = 1;

function pick<T>(list: T[]) {
  return list[Math.floor(Math.random() * list.length)];
}

function nextMessage(timeline: Timeline, t: number): Message {
  const bucket = timeline.bucketAt(t);
  const pool = bucket.hype_score > 70 ? chatHypeLines : chatLines;
  const chatter = pick(chatters);
  return {
    id: seq++,
    username: chatter.username,
    badges: chatter.badges,
    color: colorFor(chatter.username),
    body: pick(pool),
  };
}

function fill(timeline: Timeline, t: number) {
  const rows: Message[] = [];
  for (let i = FILL_ROWS; i > 0; i--) rows.push(nextMessage(timeline, t - i * 3));
  return rows;
}

export function useTimelineChat(timeline: Timeline, t: number, isPlaying: boolean): ChatDriver {
  const [messages, setMessages] = useState<Message[]>(() => fill(timeline, t));
  const lastT = useRef(t);
  const carry = useRef(0);

  useEffect(() => {
    const moved = t - lastT.current;

    if (Math.abs(moved) > SEEK_GAP_SECONDS) {
      setMessages(fill(timeline, t));
      lastT.current = t;
      carry.current = 0;
      return;
    }

    if (!isPlaying) {
      lastT.current = t;
      return;
    }

    const bucket = timeline.bucketAt(t);
    carry.current += (bucket.messages_count / BUCKET_SECONDS) * moved;
    const toAdd: Message[] = [];
    while (carry.current >= 1) {
      carry.current -= 1;
      toAdd.push(nextMessage(timeline, t));
    }
    if (toAdd.length) {
      setMessages((prev) => [...prev, ...toAdd].slice(-MAX_ROWS));
    }
    lastT.current = t;
  }, [t, timeline, isPlaying]);

  function send(body: string) {
    if (!body) return;
    setMessages((prev) =>
      [
        ...prev,
        {
          id: seq++,
          username: currentUser.username,
          badges: ["sub_gifter"] as Message["badges"],
          color: colorFor(currentUser.username),
          body,
        },
      ].slice(-MAX_ROWS),
    );
  }

  return { messages, send };
}
