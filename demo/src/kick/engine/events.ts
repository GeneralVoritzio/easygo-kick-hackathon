import { badgeLabel, colorFor, hashOf, type BadgeName } from "./chat.ts";

// The payload shapes below carry the field names listed in KICK-API-MAP Section on webhooks,
// lines 537 to 546. The only invented event is `fake-kick raid.started`, which machine.ts
// already declares.

export type Badge = { text: string; type: BadgeName; count: number };

export type Subject = {
  is_anonymous: boolean;
  user_id: number;
  username: string;
  is_verified: boolean;
  channel_slug: string;
  identity: { username_color: string; badges: Badge[] };
};

export function subject(username: string, badges: BadgeName[] = []): Subject {
  return {
    is_anonymous: false,
    user_id: 100000 + (hashOf(username) % 900000),
    username,
    is_verified: badges.includes("verified"),
    channel_slug: username.toLowerCase().replace(/[^a-z0-9]/g, ""),
    identity: {
      username_color: colorFor(username),
      badges: badges.map((type) => ({ text: badgeLabel[type], type, count: 1 })),
    },
  };
}

export type EmotePosition = { emote_id: number; positions: { s: number; e: number }[] };

export type ChatMessageSent = {
  message_id: string;
  replies_to: null;
  broadcaster: Subject;
  sender: Subject;
  content: string;
  emotes: EmotePosition[];
  created_at: string;
};

export type Gift = {
  amount: number;
  name: string;
  type: "kicks";
  tier: "common" | "epic" | "legendary";
  message: string;
  pinned_time_seconds: number;
};

export type EngineEvent =
  | { name: "kick chat.message.sent"; payload: ChatMessageSent }
  | { name: "kick channel.followed"; payload: { broadcaster: Subject; follower: Subject } }
  | {
      name: "kick channel.subscription.new";
      payload: { broadcaster: Subject; subscriber: Subject; duration: number; created_at: string };
    }
  | {
      name: "kick channel.subscription.gifts";
      payload: {
        broadcaster: Subject;
        gifter: Subject;
        giftees: Subject[];
        created_at: string;
      };
    }
  | {
      name: "kick kicks.gifted";
      payload: { broadcaster: Subject; sender: Subject; gift: Gift; created_at: string };
    }
  | {
      name: "fake-kick raid.started";
      payload: { broadcaster: Subject; raider: Subject; viewer_count_gained: number };
    };

export type EventName = EngineEvent["name"];
