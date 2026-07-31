import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { Icon, type KickIconName } from "../Icon";
import { useEvent } from "../events/EventProvider";
import { avatarFor, currentUser } from "../mock/api";
import { formatSlowMode, slugInEvent, type KickEvent } from "../mock/events";
import { useRaid } from "../raid/RaidProvider";
import { RaidBanner, RaidPanel } from "./RaidChat";
import identityBadge from "../icons/identity-badge.png";

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

function hashOf(username: string) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  return hash;
}

export function colorFor(username: string) {
  return identityColors[hashOf(username) % identityColors.length];
}

type BadgeName =
  "moderator" | "og" | "sub_gifter" | "sub_gifter_teal" | "sub_gifter_purple" | "verified";

// Read off kick.com/odablock on 27 July 2026: a badge sits in
// `flex items-center gap-1 self-center pr-1` and is `size-[calc(1em*(18/13))]`, so 19px at 14px.
// Each SVG is KICK's own markup, fills and all, taken from the live chat DOM.
const badges: Record<BadgeName, { icon: KickIconName; label: string }> = {
  moderator: { icon: "badge-moderator", label: "Moderator" },
  og: { icon: "badge-og", label: "OG" },
  sub_gifter: { icon: "badge-sub-gifter", label: "Sub gifter" },
  sub_gifter_teal: { icon: "badge-gifter-teal", label: "Sub gifter" },
  sub_gifter_purple: { icon: "badge-sub-gifter-purple", label: "Sub gifter" },
  verified: { icon: "verified", label: "Verified" },
};

const emoteFiles = import.meta.glob("../emotes/*.gif", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

// kick GET /public/v1/emotes. Names and ids read off the live emote picker on 27 July 2026.
const emotes = [
  { id: 1730753, name: "emojiAngry" },
  { id: 1579033, name: "emojiAstonished" },
  { id: 1730752, name: "emojiAngel" },
  { id: 1730754, name: "emojiAwake" },
  { id: 1579036, name: "emojiBlowKiss" },
  { id: 1730755, name: "emojiBubbly" },
  { id: 1730756, name: "emojiCheerful" },
  { id: 1730758, name: "emojiClown" },
  { id: 1730759, name: "emojiCool" },
  { id: 1730760, name: "emojiCrave" },
].map((emote) => {
  const url = emoteFiles[`../emotes/${emote.name}.gif`];
  if (!url)
    throw new Error(`No emote for ${emote.name}. Add demo/src/kick/emotes/${emote.name}.gif`);
  return { ...emote, url };
});

const emotesById = new Map(emotes.map((e) => [e.id, e]));

const emoteToken = (id: number, name: string) => `[emote:${id}:${name}]`;

function renderBody(body: string): ReactNode[] {
  return body.split(/(\[emote:\d+:[^\]]+\])/).map((part, i) => {
    const match = /^\[emote:(\d+):[^\]]+\]$/.exec(part);
    const emote = match && emotesById.get(Number(match[1]));
    if (!emote) return part;
    return (
      <img
        key={i}
        src={emote.url}
        alt={emote.name}
        title={emote.name}
        className="inline-block size-[30px] align-middle"
      />
    );
  });
}

export const chatters: { username: string; badges: BadgeName[] }[] = [
  { username: "GielinorGremlin", badges: ["og", "sub_gifter_purple"] },
  { username: "IronmanIsobel", badges: ["sub_gifter_teal"] },
  { username: "HardcoreHubert", badges: [] },
  { username: "ScytheOrBust", badges: ["sub_gifter_teal"] },
  { username: "VoidKnightVal", badges: [] },
  { username: "DegenDruid", badges: [] },
  { username: "NoDeathsNoah", badges: ["sub_gifter"] },
  { username: "ZulrahZane", badges: [] },
  { username: "PrayerFlickPip", badges: ["sub_gifter"] },
  { username: "WildyWanderer", badges: [] },
  { username: "SlayerSlander", badges: [] },
  { username: "MaxCapeMara", badges: ["moderator", "sub_gifter_purple"] },
  { username: "ClueScrollCarl", badges: ["og", "sub_gifter"] },
  { username: "BarrowsBandit", badges: ["moderator"] },
  { username: "TickPerfectTia", badges: ["sub_gifter_teal"] },
  { username: "GrindOrGraveGio", badges: [] },
  { username: "FiremakeFinn", badges: [] },
  { username: "OSRS_Oracle", badges: ["verified"] },
  { username: "SkillerSage", badges: ["sub_gifter_teal"] },
  { username: "PkerPaz", badges: [] },
  { username: "IronVowSimp42", badges: ["og"] },
  { username: "ChinFlickChad", badges: [] },
  { username: "RunecraftRon", badges: [] },
  { username: "BossMageBea", badges: ["sub_gifter_purple"] },
];

export const chatLines = [
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
  "anyone holding a kraken eye",
  "wtb kraken eye, paying in wyvern fang",
  "carl stop hoarding the kraken eyes",
];

// The event room spans every channel on the running order, so its regulars and its lines are
// about the running order and not about one stream.
const eventChatters: { username: string; badges: BadgeName[] }[] = [
  { username: "GavelGoblin", badges: ["og"] },
  { username: "MotionToVibe", badges: ["sub_gifter_purple"] },
  { username: "RunningOrderRhi", badges: [] },
  { username: "SeatSwapSam", badges: ["sub_gifter"] },
  { username: "CrossChatCass", badges: [] },
  { username: "RelayRefLarry", badges: ["og"] },
  { username: "TinderboxTina", badges: ["sub_gifter_teal"] },
  { username: "DenMotherDot", badges: [] },
  { username: "CashoutCarl", badges: [] },
  { username: "PillowFortPam", badges: ["sub_gifter"] },
  { username: "QuietHoursQuinn", badges: [] },
  { username: "SpatulaSheriff", badges: [] },
  { username: "MiseEnPlaceMo", badges: ["sub_gifter_teal"] },
  { username: "AwningAndy", badges: [] },
  { username: "DieselDaphne", badges: ["verified"] },
  { username: "HandoverHana", badges: ["sub_gifter_purple"] },
  { username: "BracketBrett", badges: [] },
  { username: "SlotOneSteve", badges: [] },
];

const eventChatLines = [
  "who is up next",
  "seat two starts in ten",
  "handing over now, go go go",
  "following all four of these already",
  "this running order is stacked",
  "whoever loses the vote hands it over",
  "one room for every channel is so good",
  "someone tell seat three to unmute",
  "that handover was clean",
  "the host set slow mode for a reason",
  "first event chat and i am staying",
  "seat four is going to win this",
  "switching over now, brb",
  "we are all in the same room right now",
  "vote is in, next seat up",
  "reminder set for the next one",
  "half of chat came from the other stream",
  "the relay rules are chaos and i love it",
];

type MessagePool = { chatters: typeof chatters; lines: string[] };

const streamPool: MessagePool = { chatters, lines: chatLines };

// The event chat inherits its moderators from the host, so only those names carry the badge.
function eventPool(moderators: string[]): MessagePool {
  return {
    chatters: eventChatters.map((chatter) =>
      moderators.includes(chatter.username)
        ? { ...chatter, badges: ["moderator" as BadgeName, ...chatter.badges] }
        : chatter,
    ),
    lines: eventChatLines,
  };
}

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

type Message = {
  id: number;
  username: string;
  badges: BadgeName[];
  color: string;
  body: string;
};

let nextId = 1;

function randomMessage(pool: MessagePool): Message {
  const chatter = pick(pool.chatters);
  const emote = pick(emotes);
  const line = pick(pool.lines);
  const roll = Math.random();
  const body =
    roll < 0.2
      ? emoteToken(emote.id, emote.name)
      : roll < 0.45
        ? `${line} ${emoteToken(emote.id, emote.name)}`
        : line;
  return { id: nextId++, ...chatter, color: colorFor(chatter.username), body };
}

function seedMessages(count: number, pool: MessagePool): Message[] {
  return Array.from({ length: count }, () => randomMessage(pool));
}

// KICK serves the rank medals from kick.com itself, which blocks any client that is not a
// browser, so gift-rank-1..3.svg are ours, drawn from a screenshot of the real medals.
// The name colour is set per rank, not per user. Rank 1 orange-300, rank 2 white, rank 3 orange-500.
const topGifters: {
  username: string;
  amount: number;
  nameClass: string;
  medal: KickIconName;
}[] = [
  {
    username: "GielinorGremlin",
    amount: 50,
    nameClass: "text-orange-300",
    medal: "gift-rank-1",
  },
  {
    username: "BarrowsBandit",
    amount: 20,
    nameClass: "text-white",
    medal: "gift-rank-2",
  },
  {
    username: "ClueScrollCarl",
    amount: 15,
    nameClass: "text-orange-500",
    medal: "gift-rank-3",
  },
];

function ChatModeMenu({ onClose, eventName }: { onClose: () => void; eventName: string }) {
  const { chatMode, setChatMode } = useEvent();
  const rows = [
    { mode: "stream" as const, label: "Stream chat", detail: "Chat with this channel" },
    { mode: "event" as const, label: "Event chat", detail: eventName },
  ];
  return (
    <div className="absolute left-1/2 top-full z-popover mt-1 w-60 -translate-x-1/2 rounded bg-surface-base p-1 shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
      {rows.map((row) => (
        <button
          key={row.mode}
          type="button"
          onClick={() => {
            setChatMode(row.mode);
            onClose();
          }}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left state-layer-surface"
        >
          <div className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-white">{row.label}</span>
            <span className="block truncate text-xs text-surface-onSurfaceSecondary">
              {row.detail}
            </span>
          </div>
          {chatMode === row.mode && (
            <span className="size-1.5 shrink-0 rounded-full bg-primary-base" />
          )}
        </button>
      ))}
    </div>
  );
}

function ChatHeader({
  onCollapse,
  eventName,
}: {
  onCollapse?: () => void;
  eventName?: string;
}) {
  const { chatMode } = useEvent();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="relative flex min-h-[38px] shrink-0 items-center justify-between border-b-2 border-[#24272c] px-3 py-1.5">
      <button
        type="button"
        aria-label="Collapse chat"
        onClick={onCollapse}
        className="state-layer-surface flex size-9 shrink-0 items-center justify-center rounded text-white"
      >
        <Icon name="collapse-chat" className="size-4" />
      </button>
      {eventName ? (
        // The translate makes this wrapper a stacking context, so the z-index must
        // sit here, or the chat messages paint over the open menu.
        <div className="z-popover absolute left-1/2 -translate-x-1/2">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="state-layer-surface flex items-center gap-1.5 rounded px-2 py-1 text-sm font-bold text-white lg:text-base"
          >
            {chatMode === "event" ? "Event chat" : "Chat"}
            <Icon
              name="chevron-right"
              className={`size-3 shrink-0 transition-transform ${
                menuOpen ? "-rotate-90" : "rotate-90"
              }`}
            />
          </button>
          {menuOpen && (
            <ChatModeMenu onClose={() => setMenuOpen(false)} eventName={eventName} />
          )}
        </div>
      ) : (
        <span className="absolute left-1/2 -translate-x-1/2 text-sm font-bold lg:text-base">
          Chat
        </span>
      )}
      <button
        type="button"
        aria-label="Viewer list"
        className="state-layer-surface flex size-9 shrink-0 items-center justify-center rounded text-white"
      >
        <Icon name="chatters" className="size-4" />
      </button>
    </div>
  );
}

type CardUser = { username: string; badges: BadgeName[] };

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY = 24 * 60 * 60 * 1000;
const CARD_NOW = new Date("2026-07-26T13:30:00Z").getTime();

function cardDate(daysAgo: number) {
  const d = new Date(CARD_NOW - daysAgo * DAY);
  return `${monthNames[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

// The live card shows real dates. Ours derive from the username, so they hold still
// between renders without a per-chatter fixture.
function cardDates(username: string) {
  const hash = hashOf(username);
  const followedDaysAgo = 14 + (hash % 320);
  return {
    followed: cardDate(followedDaysAgo),
    joined: cardDate(followedDaysAgo + 60 + ((hash >>> 3) % 600)),
  };
}

// Read off the screenshot of the live card: avatar and username on top, followed and
// joined dates in two columns, the badge row with a tooltip, then the action buttons.
// Trade is ours, and it is the only new control on the card.
function ChatUserCard({ user, onClose }: { user: CardUser; onClose: () => void }) {
  const dates = cardDates(user.username);
  return (
    <div className="absolute inset-x-2 bottom-[120px] z-popover rounded border border-outline-decorative bg-surface-base p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <img
            src={avatarFor(user.username.toLowerCase())}
            alt=""
            className="size-12 shrink-0 rounded-full"
          />
          <span className="min-w-0 truncate text-base font-bold text-white">{user.username}</span>
        </div>
        <button
          type="button"
          aria-label="Close user card"
          onClick={onClose}
          className="state-layer-surface flex size-8 shrink-0 items-center justify-center rounded text-white"
        >
          <Icon name="close" className="size-3.5" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <span className="block text-sm font-bold text-white">Followed on</span>
          <span className="block text-sm text-white">{dates.followed}</span>
        </div>
        <div>
          <span className="block text-sm font-bold text-white">Joined on</span>
          <span className="block text-sm text-white">{dates.joined}</span>
        </div>
      </div>

      {user.badges.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm font-bold text-white">Badges</span>
          {user.badges.map((name) => (
            <span key={name} className="group/badge relative flex">
              <Icon name={badges[name].icon} className="size-5" />
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-white px-2 py-1 text-xs font-bold text-black opacity-0 transition-opacity group-hover/badge:opacity-100">
                {badges[name].label}
              </span>
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="flex h-9 items-center gap-1.5 rounded bg-secondary-base px-3 text-sm font-semibold text-secondary-onSecondary betterhover:hover:bg-surface-highest"
        >
          <Icon name="heart" className="size-4" />
          Follow
        </button>
        <button
          type="button"
          className="flex h-9 items-center gap-1.5 rounded bg-secondary-base px-3 text-sm font-semibold text-secondary-onSecondary betterhover:hover:bg-surface-highest"
        >
          <Icon name="gift" className="size-4" />
          Gift a Sub
        </button>
      </div>
    </div>
  );
}

function GifterEntry({ gifter }: { gifter: (typeof topGifters)[number] }) {
  return (
    <div className="flex shrink-0 flex-row flex-nowrap items-center justify-center gap-1">
      <Icon name={gifter.medal} className="size-5" />
      <span className={`whitespace-nowrap text-sm font-semibold ${gifter.nameClass}`}>
        {gifter.username}
      </span>
      <span className="text-sm font-normal text-neutral-500">{gifter.amount}</span>
    </div>
  );
}

function GifterLeaderboard() {
  const track = (
    <div className="flex w-max min-w-full flex-row flex-nowrap items-center justify-center gap-4 overflow-hidden px-4 py-1.5">
      {topGifters.map((gifter) => (
        <GifterEntry key={gifter.username} gifter={gifter} />
      ))}
    </div>
  );
  return (
    <div className="shrink-0 overflow-hidden">
      <div className="relative flex flex-col justify-end px-5 text-sm font-medium">
        <button type="button" aria-label="Gifter leaderboard">
          <div className="flex w-full overflow-hidden border-y border-outline-decorative">
            <div className="animate-leaderboards-marquee flex min-w-full shrink-0 flex-row">
              {track}
            </div>
            <div className="animate-leaderboards-marquee flex min-w-full shrink-0 flex-row">
              {track}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

function ChatMessage({
  message,
  onOpen,
}: {
  message: Message;
  onOpen?: (user: CardUser) => void;
}) {
  return (
    <div className="group relative px-2 lg:px-3">
      <div className="betterhover:group-hover:bg-surface-highest w-full min-w-0 shrink-0 break-words rounded-lg px-2 py-[var(--chatroom-message-spacing)] text-[length:var(--chatroom-font-size)] leading-[1.5]">
        <div className="inline-flex min-w-0 flex-nowrap items-baseline rounded transition-colors betterhover:hover:bg-[#474f54]">
          {message.badges.length > 0 && (
            <div className="flex items-center gap-1 self-center pr-1">
              {message.badges.map((name) => (
                <Icon
                  key={name}
                  name={badges[name].icon}
                  title={badges[name].label}
                  className="size-[calc(1em*(18/13))] shrink-0"
                />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => onOpen?.({ username: message.username, badges: message.badges })}
            className="inline font-bold"
            style={{ color: message.color }}
          >
            {message.username}
          </button>
        </div>
        {/* A plain space dies twice here: JSX trims it, and inline-flex drops a trailing
            space in a text node. The nbsp survives both, which is the gap KICK shows. */}
        <span className="inline-flex font-bold">{": "}</span>
        <span className="font-normal leading-[1.55]">{renderBody(message.body)}</span>
      </div>
    </div>
  );
}

function ChatMessages({
  messages,
  surface,
  onOpen,
}: {
  messages: Message[];
  surface: string;
  onOpen?: (user: CardUser) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div className={`relative shrink grow overflow-hidden ${surface}`}>
      <div ref={listRef} id="chatroom-messages" className="relative h-full w-full overflow-y-auto">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function useFlowingMessages(pool: MessagePool = streamPool) {
  const [messages, setMessages] = useState<Message[]>(() => seedMessages(22, pool));

  // A room switch reseeds, because the event chat is a different room.
  useEffect(() => {
    setMessages(seedMessages(22, pool));
  }, [pool]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessages((prev) => [...prev.slice(-149), randomMessage(pool)]);
    }, 2200);
    return () => clearInterval(interval);
  }, [pool]);

  return [messages, setMessages] as const;
}

// The home hero feed: pinned to the end, overflow-y-hidden, so the reader cannot scroll it and
// the older lines run up behind the header scrim. Read from the live kick.com hero.
export function HeroChatFeed() {
  const [messages] = useFlowingMessages();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div
      ref={listRef}
      style={{ "--chatroom-message-spacing": "4px" } as CSSProperties}
      className="relative h-full w-full overflow-y-hidden"
    >
      <div className="flex min-h-full flex-col justify-end">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>
    </div>
  );
}

const pickerTabs: { icon: KickIconName; label: string }[] = [
  { icon: "picker-recent", label: "Frequently used" },
  { icon: "collectibles", label: "Collectibles" },
  { icon: "picker-global", label: "Global" },
  { icon: "emotes", label: "Emotes" },
];

function EmoteGrid({
  label,
  set,
  onPick,
}: {
  label: string;
  set: typeof emotes;
  onPick: (token: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <div className="text-xs font-medium text-neutral-400">{label}</div>
      <div className="grid grid-cols-8 justify-between gap-2">
        {set.map((emote) => (
          <button
            key={emote.id}
            type="button"
            title={emote.name}
            onClick={() => onPick(emoteToken(emote.id, emote.name))}
            className="betterhover:hover:bg-white/10 flex size-9 items-center justify-center rounded"
          >
            <img src={emote.url} alt={emote.name} className="size-7" />
          </button>
        ))}
      </div>
    </div>
  );
}

// KICK slides the panel open on max-height and fades the contents in behind it.
// Read from the live picker: max-height 50vh over 350ms ease-out, opacity over 300ms.
function EmotePicker({
  closing,
  onPick,
  onClose,
  onClosed,
}: {
  closing: boolean;
  onPick: (token: string) => void;
  onClose: () => void;
  onClosed: () => void;
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState(0);
  const match = (set: typeof emotes) =>
    query ? set.filter((e) => e.name.toLowerCase().includes(query.toLowerCase())) : set;

  return (
    <div
      id="chat-emotes-picker-panel"
      className="absolute inset-x-0 bottom-0 z-popover h-fit -translate-y-[103px]"
    >
      <div
        // The body's fade bubbles up here too, and it is the shorter of the two. Wait for the
        // panel's own animation by name, or the close is cut off 50ms early.
        onAnimationEnd={(e) => e.animationName === "emote-picker-close" && onClosed()}
        className={`bg-surface-base relative flex h-auto max-h-[50vh] w-full flex-col overflow-hidden rounded-t ${
          closing ? "animate-emote-picker-close min-h-0" : "animate-emote-picker min-h-[50px]"
        }`}
      >
        <div
          className={`overflow-y-auto pt-1 ${
            closing ? "animate-emote-picker-body-close" : "animate-emote-picker-body"
          }`}
        >
          <div className="grid gap-1">
            <div className="grid gap-4 pt-2.5 lg:pl-5 lg:pr-2 lg:pt-2">
              <div className="flex items-center gap-2">
                <div className="relative grow">
                  <Icon
                    name="picker-search"
                    className="text-surface-onSurfaceSecondary pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2"
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search emotes"
                    aria-label="Search emotes"
                    className="border-outline-region bg-surface-lowest placeholder:text-surface-onSurfaceSecondary h-9 w-full rounded border pl-8 pr-2 text-sm text-white outline-none"
                  />
                </div>
                <button
                  type="button"
                  aria-label="Close emote picker"
                  onClick={onClose}
                  className="state-layer-surface flex size-9 shrink-0 items-center justify-center rounded text-white"
                >
                  <Icon name="close" className="size-4" />
                </button>
              </div>

              <div className="no-scrollbar relative w-full max-w-full overflow-y-auto pr-3">
                <div className="flex items-center gap-2">
                  {pickerTabs.map((entry, i) => (
                    <button
                      key={entry.label}
                      type="button"
                      aria-label={entry.label}
                      title={entry.label}
                      onClick={() => setTab(i)}
                      className={`state-layer-surface flex size-10 shrink-0 grow-0 items-center justify-center rounded ${
                        i === tab ? "text-primary-base" : "text-white"
                      }`}
                    >
                      <Icon name={entry.icon} className="size-6" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pl-5 pr-2.5">
              <div className="h-60 overflow-y-auto py-2 pr-2.5">
                <div className="grid gap-2">
                  <EmoteGrid
                    label="Frequently Used"
                    set={match(emotes.slice(0, 6))}
                    onPick={onPick}
                  />
                  <EmoteGrid label="Global" set={match(emotes)} onPick={onPick} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// The bar clips to one row: h-7 with max-h-7, wrap on, overflow hidden. It carries no gap.
// KICK spreads the row with lg:justify-between, and each button is a square of the row height.
function EmoteBar({ onSend }: { onSend: (body: string) => void }) {
  return (
    <div className="flex flex-col gap-1 pb-1 empty:hidden">
      <div className="overflow-hidden">
        <div
          aria-label="Emotes"
          className="flex h-7 max-h-7 w-full max-w-full flex-wrap items-center overflow-hidden empty:hidden lg:justify-between"
        >
          {emotes.map((emote) => (
            <div key={emote.id} className="h-full w-fit">
              <button
                type="button"
                title={emote.name}
                onClick={() => onSend(emoteToken(emote.id, emote.name))}
                className="betterhover:hover:bg-white/10 relative aspect-square h-full shrink-0 rounded-sm p-0.5"
              >
                <img src={emote.url} alt={emote.name} className="h-full w-full" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatFooter({
  draft,
  dashboard,
  onChange,
  onSend,
  onSubmit,
}: {
  draft: string;
  dashboard?: boolean;
  onChange: (value: string) => void;
  onSend: (body: string) => void;
  onSubmit: () => void;
}) {
  const [picker, setPicker] = useState<"closed" | "open" | "closing">("closed");
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const pickerOpen = picker !== "closed";
  const closePicker = () => setPicker((state) => (state === "open" ? "closing" : state));

  // KICK's field grows with the text and stops at 150px, then scrolls. A textarea only reports
  // the height it needs once it has been collapsed, so measure from auto every time.
  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${field.scrollHeight}px`;
  }, [draft]);

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    closePicker();
    onSubmit();
  }

  return (
    // The panel is a sibling of the padded box, never a child of it. The box clips its own
    // overflow, so a panel inside it would be cut off at the footer edge.
    <div id="chatroom-footer" className="relative flex w-full shrink-0 flex-col">
      {pickerOpen && (
        <EmotePicker
          closing={picker === "closing"}
          onClose={closePicker}
          onClosed={() => setPicker("closed")}
          onPick={(token) => onChange(draft ? `${draft} ${token}` : token)}
        />
      )}

      <div
        className={`flex w-full shrink-0 flex-col overflow-hidden px-2 py-3 transition-all duration-300 ease-in-out lg:px-5 ${
          pickerOpen ? "bg-surface-base" : ""
        }`}
      >
        <EmoteBar onSend={onSend} />

        <div className="flex flex-col gap-2">
          <div
            id="chat-input-wrapper"
            className="betterhover:hover:border-neutral-400 flex w-full items-center rounded border-2 border-neutral-700 pl-2 pr-1 transition-colors duration-200 ease-in-out focus-within:border-transparent focus-within:bg-[#070809] focus-within:outline-none focus-within:ring-1 focus-within:ring-[#F4F5F6] focus-within:ring-offset-1 focus-within:hover:border-transparent"
          >
            <button
              type="button"
              aria-label="Chat identity"
              data-testid="identity-badge-chat_identity"
              className="state-layer-surface mt-1.5 flex h-[30px] w-[26px] shrink-0 select-none items-center justify-center self-start rounded"
            >
              <img src={identityBadge} alt="" className="size-4" />
            </button>
            {/* KICK centres the placeholder against the whole 46px wrapper with an absolute
              element, not against the field's own line box. Copy that, or it sits high. */}
            <div className="relative min-w-0 flex-1">
              <textarea
                ref={fieldRef}
                rows={1}
                value={draft}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={onKeyDown}
                aria-label="Send a message"
                className="block max-h-[150px] min-h-[42px] w-full resize-none overflow-y-auto break-words bg-transparent px-2.5 py-[9px] text-sm leading-5 text-white outline-none"
              />
              {!draft && (
                <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 select-none pl-[1px] text-sm font-medium leading-4 text-[#768087]">
                  Send a message
                </div>
              )}
            </div>
            <button
              type="button"
              aria-label="Emotes"
              onClick={() => setPicker((state) => (state === "closed" ? "open" : "closing"))}
              className="state-layer-surface flex size-9 shrink-0 items-center justify-center rounded text-white"
            >
              <Icon name="emotes" className="size-4" />
            </button>
          </div>

          <div className="flex shrink-0 grow-0 items-center gap-1 lg:w-full lg:gap-0">
            <div className="flex gap-x-1 lg:w-full lg:gap-x-2">
              {dashboard ? (
                // The dashboard drops the count and the Get KICKs button. The points button
                // holds the points glyph and KICK's own KICKs mark, both white.
                <button
                  type="button"
                  aria-label="Channel points"
                  className="state-layer-surface flex shrink-0 items-center gap-1 rounded px-2 py-1.5 text-sm font-semibold text-white"
                >
                  <Icon name="channel-points" className="size-4" />
                  <Icon name="chat-kicks" className="size-5" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    aria-label="Channel points"
                    className="state-layer-surface flex h-9 shrink-0 items-center gap-1.5 rounded px-2 text-sm font-semibold text-white"
                  >
                    <Icon name="channel-points" className="size-4" />
                    40
                  </button>
                  <button
                    type="button"
                    aria-label="Get KICKs"
                    className="state-layer-surface flex h-9 shrink-0 items-center gap-1.5 rounded px-2 text-sm font-semibold text-white"
                  >
                    <Icon name="get-kicks" className="size-4" />0
                  </button>
                </>
              )}
            </div>
            <div className="ml-auto flex items-center gap-x-2">
              <button
                type="button"
                aria-label="Chat settings"
                className="state-layer-surface flex size-9 shrink-0 items-center justify-center rounded text-white"
              >
                <Icon name="chat-settings" className="size-4" />
              </button>
              <button
                type="submit"
                onClick={closePicker}
                className="bg-primary-base text-primary-onPrimary flex h-8 shrink-0 items-center justify-center rounded px-3 text-sm font-semibold"
              >
                Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// The dashboard panels are lighter than the page under them, so the chat runs on surface-base
// there. On the channel page one surface runs across the whole site, so it runs on surface-lowest.
export function ChatFeed({
  header,
  dashboard,
  pool,
  event,
}: {
  header?: ReactNode;
  dashboard?: boolean;
  pool?: MessagePool;
  event?: KickEvent;
}) {
  const surface = dashboard ? "bg-surface-base" : "bg-surface-lowest";
  const { chatMode, boost } = useEvent();
  const eventMode = Boolean(event) && chatMode === "event";
  const [messages, setMessages] = useFlowingMessages(pool);
  const [draft, setDraft] = useState("");
  const { raid } = useRaid();
  const [panelOpen, setPanelOpen] = useState(true);
  const [cardUser, setCardUser] = useState<CardUser | null>(null);

  function send(body: string) {
    if (!body) return;
    // The event chat takes moderator commands, and the demo viewer is always a
    // moderator. A command never echoes into the room.
    if (eventMode && event && body.toLowerCase().startsWith("/boost ")) {
      const slug = slugInEvent(event, body.slice(7));
      if (slug) boost(slug);
      return;
    }
    setMessages((prev) => [
      ...prev.slice(-149),
      {
        id: nextId++,
        username: currentUser.username,
        badges: ["sub_gifter"],
        color: colorFor(currentUser.username),
        body,
      },
    ]);
  }

  function sendDraft(e: FormEvent) {
    e.preventDefault();
    send(draft.trim());
    setDraft("");
  }

  return (
    <form
      onSubmit={sendDraft}
      // KICK exposes the spacing as a viewer setting. Their default is 4px, we run compact.
      style={{ "--chatroom-message-spacing": "2px" } as CSSProperties}
      className={`${surface} relative flex h-full w-full flex-col overflow-hidden`}
    >
      {header}
      <RaidBanner open={panelOpen} onToggle={() => setPanelOpen((v) => !v)} />
      <ChatMessages messages={messages} surface={surface} onOpen={setCardUser} />
      {raid && panelOpen && <RaidPanel onClose={() => setPanelOpen(false)} />}
      <ChatFooter
        draft={draft}
        dashboard={dashboard}
        onChange={setDraft}
        onSend={send}
        onSubmit={() => {
          send(draft.trim());
          setDraft("");
        }}
      />
      {cardUser && <ChatUserCard user={cardUser} onClose={() => setCardUser(null)} />}
    </form>
  );
}

function EventChatStrip({ event }: { event: KickEvent }) {
  const mods = event.chat.moderators;

  return (
    <div
      data-testid="event-chat-strip"
      className="flex shrink-0 items-center gap-2 border-y border-outline-decorative px-3 py-2"
    >
      <img src={event.host_channel.avatar} alt="" className="size-7 shrink-0 rounded-full" />
      <div className="flex min-w-0 grow flex-col gap-1">
        <Link
          to={`/events/${event.slug}`}
          className="truncate text-sm font-bold text-white betterhover:hover:underline"
        >
          Event chat, hosted by {event.host_channel.username}
        </Link>
        <div className="flex flex-wrap items-center gap-1">
          <span
            title={mods.length > 0 ? `Moderators: ${mods.join(", ")}` : undefined}
            className="flex items-center gap-1 whitespace-nowrap rounded-full bg-secondary-base px-2 py-0.5 text-xs font-semibold text-secondary-onSecondary"
          >
            <Icon name="chat-settings" className="size-3 shrink-0 fill-current" />
            Moderated by {event.host_channel.username}
          </span>
          <span className="whitespace-nowrap rounded-full bg-secondary-base px-2 py-0.5 text-xs font-semibold text-secondary-onSecondary">
            {formatSlowMode(event.chat.slow_mode_seconds)}
          </span>
          {event.chat.is_subscribers_only && (
            <span className="whitespace-nowrap rounded-full bg-secondary-base px-2 py-0.5 text-xs font-semibold text-secondary-onSecondary">
              Subscribers only
            </span>
          )}
        </div>
      </div>
      <Link
        to={`/events/${event.slug}`}
        aria-label="Open the event page"
        className="flex size-8 shrink-0 items-center justify-center rounded text-white state-layer-surface"
      >
        <Icon name="dash-external" className="size-4 fill-current" />
      </Link>
    </div>
  );
}

export function ChannelChat({
  onCollapse,
  event,
}: {
  onCollapse?: () => void;
  event?: KickEvent;
}) {
  // The room lives in the event provider, because the multiview and the /boost command read it too.
  const { chatMode } = useEvent();
  const inEvent = Boolean(event) && chatMode === "event";
  // A fresh pool object on every render would retrigger the reseed effect, so hold it steady.
  const pool = useMemo(
    () => (inEvent && event ? eventPool(event.chat.moderators) : undefined),
    [inEvent, event],
  );

  return (
    <ChatFeed
      // A switch is a different room, so the feed reseeds instead of showing the old room's tail.
      key={chatMode}
      pool={pool}
      event={event}
      header={
        <>
          <ChatHeader onCollapse={onCollapse} eventName={event?.title} />
          {inEvent && event ? <EventChatStrip event={event} /> : <GifterLeaderboard />}
        </>
      }
    />
  );
}
