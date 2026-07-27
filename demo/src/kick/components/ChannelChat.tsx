import { useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "../Icon";
import { currentUser } from "../mock/api";

// Identity colours resolved from assets/reference/kick-neon-tokens.css (--neon-identity-*).
const identityColors = [
  "#fea0cf", // bubblegum
  "#a0f6fe", // celeste
  "#fea0a0", // coral
  "#18e9fb", // cyan
  "#eacdfe", // lavender
  "#b8fea0", // lime
  "#fecdcd", // melon
  "#18fbb0", // mint
  "#a0fede", // mist
  "#75fd45", // neon
  "#a0d5fe", // powder
  "#fd72b8", // rose
  "#fedaa0", // sand
  "#45adfc", // sky
  "#fcb645", // sunshine
  "#d8a0fe", // violet
];

function colorFor(username: string) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  return identityColors[hash % identityColors.length];
}

const chatUsernames = [
  "GielinorGremlin",
  "IronmanIsobel",
  "HardcoreHubert",
  "ScytheOrBust",
  "VoidKnightVal",
  "DegenDruid",
  "NoDeathsNoah",
  "ZulrahZane",
  "PrayerFlickPip",
  "WildyWanderer",
  "SlayerSlander",
  "MaxCapeMara",
  "ClueScrollCarl",
  "BarrowsBandit",
  "TickPerfectTia",
  "GrindOrGraveGio",
  "FiremakeFinn",
  "OSRS_Oracle",
  "SkillerSage",
  "PkerPaz",
  "IronVowSimp42",
  "ChinFlickChad",
  "RunecraftRon",
  "BossMageBea",
];

const modUsernames = new Set(["BarrowsBandit", "MaxCapeMara"]);

const chatLines = [
  "one death and it's over lol",
  "GET THE FIRE CAPE",
  "chat this is actually insane",
  "pray flick or you're dying",
  "did he just tick manip that",
  "ironman mentality W",
  "no deaths challenge is diabolical",
  "zulrah phase check",
  "clip that for the vod",
  "praying to rng gods rn",
  "this drop rate is criminal",
  "hardcore nerves are unmatched",
  "someone send a clue scroll",
  "chat calm down it's fine",
  "restock the food before wildy",
  "that was way too close",
  "W stream honestly",
  "how many hours in ironman now",
  "sub goal when",
  "run it back",
];

type Message = { id: number; username: string; color: string; body: string };

let nextId = 1;

function randomMessage(): Message {
  const username = chatUsernames[Math.floor(Math.random() * chatUsernames.length)];
  const body = chatLines[Math.floor(Math.random() * chatLines.length)];
  return { id: nextId++, username, color: colorFor(username), body };
}

function seedMessages(count: number): Message[] {
  return Array.from({ length: count }, randomMessage);
}

const topGifters = [
  { username: "GielinorGremlin", amount: 42000 },
  { username: "BarrowsBandit", amount: 18500 },
  { username: "ClueScrollCarl", amount: 9200 },
];

export function ChannelChat() {
  const [messages, setMessages] = useState<Message[]>(() => seedMessages(22));
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessages((prev) => [...prev.slice(-149), randomMessage()]);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function sendMessage(e: FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setMessages((prev) => [
      ...prev.slice(-149),
      { id: nextId++, username: currentUser.username, color: colorFor(currentUser.username), body },
    ]);
    setDraft("");
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-surface-lowest">
      <div className="flex min-h-[38px] shrink-0 items-center justify-between border-b-2 border-[#24272C] px-1.5 py-3">
        <button
          type="button"
          aria-label="Chat participants"
          className="flex size-7 shrink-0 items-center justify-center rounded state-layer-surface"
        >
          <Icon name="chatters" className="size-4" />
        </button>
        <span className="text-sm font-semibold leading-[1.2] text-white">Chat</span>
        <button
          type="button"
          aria-label="Collapse chat"
          className="flex size-7 shrink-0 items-center justify-center rounded state-layer-surface"
        >
          <Icon name="collapse-chat" className="size-4" />
        </button>
      </div>

      <div className="no-scrollbar flex h-[34px] shrink-0 items-center gap-4 overflow-x-auto border-y border-[#24272C] px-3">
        {topGifters.map((g, i) => (
          <div key={g.username} className="flex shrink-0 items-center gap-1 text-xs font-semibold leading-none">
            <span className="text-surface-onSurfaceSecondary">#{i + 1}</span>
            <Icon name="gift" className="size-3.5 text-primary-base" />
            <span className="text-white">{g.username}</span>
            <span className="text-primary-base">{g.amount.toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 lg:px-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className="rounded-lg px-2 py-1 text-sm betterhover:hover:bg-surface-highest"
            style={{ lineHeight: 1.55 }}
          >
            {modUsernames.has(m.username) && (
              <Icon name="verified" className="mr-1 inline-block size-[19px] shrink-0 align-middle" />
            )}
            <span className="font-bold" style={{ color: m.color }}>
              {m.username}
            </span>
            <span className="font-bold text-white">{": "}</span>
            <span className="font-normal text-white">{m.body}</span>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="shrink-0 p-3">
        <div className="flex h-[45px] items-center gap-2 rounded border-2 border-neutral-700 bg-transparent px-3 transition-colors duration-200 betterhover:hover:border-neutral-400 focus-within:border-neutral-400">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Send a message"
            aria-label="Send a message"
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-surface-onSurfaceSecondary"
          />
          <button
            type="submit"
            className="flex h-8 shrink-0 items-center justify-center rounded bg-primary-base px-3 text-sm font-semibold text-primary-onPrimary"
          >
            Chat
          </button>
        </div>
      </form>
    </div>
  );
}
