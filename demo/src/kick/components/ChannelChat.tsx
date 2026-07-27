import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Icon, type KickIconName } from "../Icon";
import { currentUser } from "../mock/api";
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

function colorFor(username: string) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  return identityColors[hash % identityColors.length];
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

const chatters: { username: string; badges: BadgeName[] }[] = [
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

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

type Message = {
  id: number;
  username: string;
  badges: BadgeName[];
  color: string;
  body: string;
};

let nextId = 1;

function randomMessage(): Message {
  const chatter = pick(chatters);
  const emote = pick(emotes);
  const line = pick(chatLines);
  const roll = Math.random();
  const body =
    roll < 0.2
      ? emoteToken(emote.id, emote.name)
      : roll < 0.45
        ? `${line} ${emoteToken(emote.id, emote.name)}`
        : line;
  return { id: nextId++, ...chatter, color: colorFor(chatter.username), body };
}

function seedMessages(count: number): Message[] {
  return Array.from({ length: count }, randomMessage);
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

function ChatHeader({ onCollapse }: { onCollapse?: () => void }) {
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
      <span className="absolute left-1/2 -translate-x-1/2 text-sm font-bold lg:text-base">
        Chat
      </span>
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

function ChatMessage({ message }: { message: Message }) {
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
          <button type="button" className="inline font-bold" style={{ color: message.color }}>
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

function ChatMessages({ messages }: { messages: Message[] }) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div className="relative shrink grow overflow-hidden bg-surface-lowest">
      <div ref={listRef} id="chatroom-messages" className="relative h-full w-full overflow-y-auto">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>
    </div>
  );
}

function useFlowingMessages() {
  const [messages, setMessages] = useState<Message[]>(() => seedMessages(22));

  useEffect(() => {
    const interval = setInterval(() => {
      setMessages((prev) => [...prev.slice(-149), randomMessage()]);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return [messages, setMessages] as const;
}

// The home hero feed: pinned to the end, overflow-y-hidden, so the reader cannot scroll it and
// the older lines run up behind the header scrim. Read from the live kick.com hero.
export function ChatFeed() {
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

// The bar clips to one row: h-7 with max-h-7, wrap on, overflow hidden.
function EmoteBar({ onSend }: { onSend: (body: string) => void }) {
  return (
    <div className="flex flex-col gap-1 pb-1 empty:hidden">
      <div className="overflow-hidden">
        <div
          aria-label="Emotes"
          className="flex h-7 max-h-7 w-full max-w-full flex-wrap items-center gap-0.5 overflow-hidden empty:hidden"
        >
          {emotes.map((emote) => (
            <button
              key={emote.id}
              type="button"
              title={emote.name}
              onClick={() => onSend(emoteToken(emote.id, emote.name))}
              className="state-layer-surface flex h-full w-fit items-center justify-center rounded px-0.5"
            >
              <img src={emote.url} alt={emote.name} className="size-6" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatFooter({
  draft,
  onChange,
  onSend,
  onSubmit,
}: {
  draft: string;
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
          <div className="betterhover:hover:border-neutral-400 flex w-full items-center rounded border-2 border-neutral-700 pl-2 pr-1 transition-colors duration-200 ease-in-out focus-within:border-neutral-400">
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

          <div className="flex shrink-0 grow-0 items-center gap-2">
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
            <div className="flex-1" />
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
  );
}

export function ChannelChat({ onCollapse }: { onCollapse?: () => void }) {
  const [messages, setMessages] = useFlowingMessages();
  const [draft, setDraft] = useState("");

  function send(body: string) {
    if (!body) return;
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
      className="bg-surface-lowest flex h-full w-full flex-col overflow-hidden"
    >
      <ChatHeader onCollapse={onCollapse} />
      <GifterLeaderboard />
      <ChatMessages messages={messages} />
      <ChatFooter
        draft={draft}
        onChange={setDraft}
        onSend={send}
        onSubmit={() => {
          send(draft.trim());
          setDraft("");
        }}
      />
    </form>
  );
}
