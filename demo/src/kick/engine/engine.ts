import {
  chatLines,
  chatters,
  emoteCatalog,
  emoteToken,
  hypeLines,
  saltLines,
  type BadgeName,
} from "./chat.ts";
import { subject, type ChatMessageSent, type EngineEvent, type Subject } from "./events.ts";
import { createRandom } from "./rng.ts";
import { surgeFactor, surgeIsOver, type Surge } from "./surge.ts";

// This file takes plain numbers and names, so engine.check.ts can run it on plain node.

const TICK_MS = 200;
const CHAT_DRAIN_MS = 240;
const MESSAGES_PER_MINUTE_PER_100_VIEWERS = 1.8;
const MAX_QUEUED_MESSAGES = 40;
const HYPE_THRESHOLD = 1.7;
const SALT_SHARE = 0.22;
const SEED = 0x5f3c21;

export type EngineChannel = { username: string; verified: boolean; viewers: number };

export type EngineHost = EngineChannel & { raiders: EngineChannel[] };

export type EngineState = {
  viewers: number;
  messagesPerMinute: number;
  multiplier: number;
};

export type Handlers = {
  onEvent?: (event: EngineEvent) => void;
  onState?: (state: EngineState) => void;
};

export type FireKind = "raid" | "whale" | "subtrain";

export const fireKinds: { kind: FireKind; label: string }[] = [
  { kind: "raid", label: "Raid" },
  { kind: "whale", label: "5,000 kicks" },
  { kind: "subtrain", label: "Sub train" },
];

export function createEngine(host: EngineHost) {
  const random = createRandom(SEED);
  const broadcaster = subject(host.username, host.verified ? ["verified"] : []);
  const target = host.viewers;

  let now = 0;
  let viewers = target;
  let surgeAdd = 0;
  let multiplier = 1;
  let messagesPerMinute = 0;
  let surges: Surge[] = [];
  let queue: ChatMessageSent[] = [];
  let tickTimer: ReturnType<typeof setInterval> | undefined;
  let drainTimer: ReturnType<typeof setInterval> | undefined;

  const handlers = new Set<Handlers>();
  const emit = (event: EngineEvent) => handlers.forEach((h) => h.onEvent?.(event));
  const stamp = () => new Date().toISOString();

  const messageId = () =>
    `${random.int(0x10000000, 0x7fffffff).toString(16)}-${random.int(0x1000, 0xffff).toString(16)}`;

  const badgesOf = (username: string): BadgeName[] =>
    chatters.find((c) => c.username === username)?.badges ?? [];

  function write() {
    const pool =
      multiplier > HYPE_THRESHOLD ? hypeLines : random.chance(SALT_SHARE) ? saltLines : chatLines;
    const line = random.pick(pool);
    const emote = random.pick(emoteCatalog);
    const roll = random.next();
    if (roll < 0.2) return { content: emoteToken(emote.id, emote.name), emote };
    if (roll < 0.45) return { content: `${line} ${emoteToken(emote.id, emote.name)}`, emote };
    return { content: line, emote: null };
  }

  function chatMessage(username?: string, content?: string): ChatMessageSent {
    const chatter = username ? { username, badges: badgesOf(username) } : random.pick(chatters);
    const written = content ? { content, emote: null } : write();
    const at = written.emote ? written.content.indexOf("[emote:") : -1;
    const token = written.emote ? emoteToken(written.emote.id, written.emote.name) : "";
    return {
      message_id: messageId(),
      replies_to: null,
      broadcaster,
      sender: subject(chatter.username, chatter.badges),
      content: written.content,
      emotes:
        written.emote && at >= 0
          ? [{ emote_id: written.emote.id, positions: [{ s: at, e: at + token.length }] }]
          : [],
      created_at: stamp(),
    };
  }

  const say = (username?: string, content?: string) => queue.push(chatMessage(username, content));

  function giftKicks(username: string, amount: number, message: string) {
    emit({
      name: "kick kicks.gifted",
      payload: {
        broadcaster,
        sender: subject(username, badgesOf(username)),
        gift: {
          amount,
          name: amount >= 2000 ? "Kick Bomb" : "Kick Pack",
          type: "kicks",
          tier: amount >= 2000 ? "legendary" : amount >= 500 ? "epic" : "common",
          message,
          pinned_time_seconds: amount >= 2000 ? 120 : 30,
        },
        created_at: stamp(),
      },
    });
  }

  function tick() {
    const dt = TICK_MS / 1000;
    now += dt;

    surges = surges.filter((surge) => !surgeIsOver(surge, now));
    const factor = surgeFactor(surges, now);
    multiplier = factor.mult;

    const base = viewers - surgeAdd;
    const settled = base + (target - base) * 0.004 + (random.next() - 0.5) * base * 0.004;
    surgeAdd = factor.add;
    viewers = Math.max(0, Math.round(settled + surgeAdd));

    messagesPerMinute = (viewers / 100) * MESSAGES_PER_MINUTE_PER_100_VIEWERS * multiplier;
    const expected = (messagesPerMinute / 60) * dt;
    const whole = Math.floor(expected);
    const count = whole + (random.chance(expected - whole) ? 1 : 0);
    for (let i = 0; i < count; i++) say();

    if (random.chance((viewers / 90000) * multiplier * dt * 3)) {
      emit({
        name: "kick channel.followed",
        payload: { broadcaster, follower: subject(random.pick(chatters).username) },
      });
    }
    if (random.chance((viewers / 300000) * multiplier * dt * 3)) {
      emit({
        name: "kick channel.subscription.new",
        payload: {
          broadcaster,
          subscriber: subject(random.pick(chatters).username),
          duration: 1,
          created_at: stamp(),
        },
      });
    }
    if (random.chance((viewers / 220000) * multiplier * dt * 3)) {
      giftKicks(random.pick(chatters).username, random.pick([100, 100, 200, 250, 500, 1000]), "");
    }

    handlers.forEach((h) => h.onState?.({ viewers, messagesPerMinute, multiplier }));
  }

  // A chat panel drops messages when the room outruns it, so the queue is capped and the
  // oldest ones go first.
  function drain() {
    if (queue.length === 0) return;
    if (queue.length > MAX_QUEUED_MESSAGES) queue = queue.slice(-MAX_QUEUED_MESSAGES);
    emit({ name: "kick chat.message.sent", payload: queue.shift()! });
  }

  function fireRaid() {
    const raider = random.pick(host.raiders);
    const gained = Math.round(raider.viewers * 0.55);
    surges.push({ at: now, peak: gained, rise: 6, decay: 90, mult: 4.4 });
    emit({
      name: "fake-kick raid.started",
      payload: {
        broadcaster,
        raider: subject(raider.username, raider.verified ? ["verified"] : []),
        viewer_count_gained: gained,
      },
    });
    say("BarrowsBandit", "RAID LETS GOOO");
    say(undefined, `${raider.username} army reporting in`);
  }

  function fireWhale() {
    surges.push({ at: now, peak: 1600, rise: 5, decay: 110, mult: 3.6 });
    giftKicks("GielinorGremlin", 5000, "this stream carried my whole week");
    say(undefined, "5000 KICKS??");
    say("MaxCapeMara", "GREMLIN THE GOAT");
  }

  function fireSubTrain() {
    surges.push({ at: now, peak: 900, rise: 6, decay: 80, mult: 2.4 });
    emit({
      name: "kick channel.subscription.gifts",
      payload: {
        broadcaster,
        gifter: subject("BarrowsBandit", badgesOf("BarrowsBandit")),
        giftees: Array.from({ length: 18 }, () => subject(random.pick(chatters).username)),
        created_at: stamp(),
      },
    });
    say(undefined, "SUB TRAIN LETS GO");
  }

  return {
    listen(next: Handlers) {
      handlers.add(next);
      return () => {
        handlers.delete(next);
      };
    },
    start() {
      if (tickTimer !== undefined) return;
      tickTimer = setInterval(tick, TICK_MS);
      drainTimer = setInterval(drain, CHAT_DRAIN_MS);
    },
    stop() {
      clearInterval(tickTimer);
      clearInterval(drainTimer);
      tickTimer = undefined;
      drainTimer = undefined;
    },
    // Step the clock by hand. The check runs on this, and a speed control can use it too.
    advance(seconds: number) {
      const ticks = Math.round(seconds / (TICK_MS / 1000));
      for (let i = 0; i < ticks; i++) {
        tick();
        drain();
      }
    },
    fire(kind: FireKind) {
      if (kind === "raid") fireRaid();
      if (kind === "whale") fireWhale();
      if (kind === "subtrain") fireSubTrain();
    },
    // A panel that mounts mid-stream needs a scrollback, the same way KICK serves the last
    // messages when you open a channel.
    seedChat: (count: number) => Array.from({ length: count }, () => chatMessage()),
    state: (): EngineState => ({ viewers, messagesPerMinute, multiplier }),
    broadcaster: (): Subject => broadcaster,
  };
}

export type Engine = ReturnType<typeof createEngine>;
