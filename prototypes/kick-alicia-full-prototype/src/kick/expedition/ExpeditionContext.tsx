import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Livestream } from "../mock/api";
import {
  createExpeditions,
  ENDING_SOON_DEMO_EXPEDITION_ID,
  KICK_BREAK_REWARD_POINTS,
  STOP_DURATION_SECONDS,
  WAITING_ROOM_DEMO_EXPEDITION_ID,
  type Expedition,
} from "./data";

/*
  How long the "Departing to X" transit view holds before the new stop's video actually loads —
  "don't instantly teleport." Ported from kick-web-redesign's ExpeditionContext.tsx.
*/
const TRANSITION_MS = 2600;
const TICK_MS = 1000;

// Once in a while a mocked viewer on a full, still-boarding expedition drops off before
// departure — the real trigger for "if anyone drops off, waitlist people are added."
const DROP_OFF_CHANCE_PER_TICK = 0.12;

// A viewer gets one expedition of their own running at a time — Kicks buys another concurrent
// slot instead of raising a hard cap, so there's always a real cost to running more than one.
export const KICKS_STARTING_BALANCE = 250;
export const EXTRA_SLOT_COST = 100;
// A next-stop vote's options are random by default — naming a specific streamer instead costs
// Kicks, the same "real cost, not a hard limit" reasoning EXTRA_SLOT_COST already follows.
export const SUGGEST_STOP_COST = 50;
// Voted off by Kick Vote: paying this survives it instead. Same reasoning as SUGGEST_STOP_COST.
export const KICK_VOTE_SAVE_COST = 75;

export type EndedExpeditionNotice = {
  endedName: string;
  /** null when nobody besides "you" was on it, so there was nobody left to pour anywhere. */
  pouredInto: string | null;
  pouredCount: number;
};

export type ChannelPointsNotice = {
  amount: number;
  streamerName: string;
};

export type HandoffNotice = {
  expeditionName: string;
  newLeader: string;
};

type ExpeditionContextValue = {
  expeditions: Expedition[];
  /** Which expedition "you" are currently riding, if any. */
  riderExpeditionId: string | null;
  join: (id: string) => void;
  /** True when `id` isn't one of your own and you're already running a live expedition (or Kick
   *  Break) of your own — the lobby uses this to explain a disabled join button rather than let
   *  the click silently do nothing. */
  blockedByOwnExpedition: (id: string) => boolean;
  hopOff: () => void;
  currentStop: (expedition: Expedition) => Livestream;
  /** Adds a viewer-created expedition (Quick or Custom) to the live list. */
  createExpedition: (expedition: Expedition) => void;
  /** Replaces an existing expedition in place, keeping its id — what continuing to edit a saved
   *  draft calls instead of createExpedition, so re-saving updates it rather than duplicating it. */
  updateExpedition: (id: string, expedition: Expedition) => void;
  /** What a resolved next-stop vote calls: grows a chat-decided expedition's route by one and
   *  moves straight to it. */
  appendStop: (expeditionId: string, stream: Livestream) => void;
  /** What a resolved "move on now" vote calls for a pre-built route: advances to the next stop
   *  right away instead of waiting on a timer. A chat-picked route calls appendStop instead. */
  advanceStop: (expeditionId: string) => void;

  /** A boarding expedition that was full when "you" tried to join it. */
  waitlistedExpeditionId: string | null;
  joinWaitlist: (id: string) => void;
  leaveWaitlist: () => void;

  /** Expeditions "you" have been voted off of (Kick Vote) — join() and joinWaitlist() both
   *  refuse an id in here, for the rest of the session. */
  kickedExpeditionIds: Set<string>;
  /** Records that "you" were kicked off `id`. */
  markKicked: (id: string) => void;
  /** A spot freed up and "you" were promoted off the waitlist for this one — a real seat, but
   *  not confirmed until join() is called for it (the departure toast's "Join" button, or the
   *  lobby card). Left unconfirmed at departure, the spot goes to someone else instead. */
  provisionalRiderId: string | null;
  /** The expedition "you" were just promoted into, to prompt the "a spot opened up" toast —
   *  cleared once that toast has been shown or dismissed. */
  promotedNotice: Expedition | null;
  clearPromotedNotice: () => void;
  /** The expedition "you" held a provisional spot on and never confirmed before it departed —
   *  cleared once the "you missed it" toast has been shown or dismissed. */
  missedNotice: Expedition | null;
  clearMissedNotice: () => void;

  /** Hands a viewer-created expedition's leadership to newLeader (from findHandoffCandidate) —
   *  the expedition itself, and everyone on it, keeps going untouched. Frees up "your" slot. */
  handOffLeadership: (id: string, newLeader: string) => void;
  /** What just happened via handOffLeadership, for a one-time confirmation. */
  handoffNotice: HandoffNotice | null;
  clearHandoffNotice: () => void;
  /** The fallback when nobody is free to take over: removes the expedition entirely and pours
   *  everyone on it (you included) into a single stream, per its own endBehavior — the last
   *  stream shown, a specific streamer chosen at creation, or chat's pick. Returns that stream
   *  so the caller can navigate there, or undefined if it had no stops left to pour into. */
  endExpedition: (id: string) => Livestream | undefined;
  /** How many of "your" own created expeditions can be running at once — 1 plus one per
   *  purchased slot. */
  maxConcurrentCreated: number;
  kicksBalance: number;
  /** Spends EXTRA_SLOT_COST Kicks for one more concurrent slot. Returns false and spends
   *  nothing if the balance can't cover it. */
  purchaseExtraSlot: () => boolean;
  /** Spends `amount` Kicks — for anything else priced in Kicks, like suggesting a specific
   *  streamer onto a next-stop vote. Returns false and spends nothing if the balance can't cover
   *  it. */
  spendKicks: (amount: number) => boolean;
  /** What just happened to an ended expedition's other viewers, for a one-time confirmation. */
  endedNotice: EndedExpeditionNotice | null;
  clearEndedNotice: () => void;

  /** Removes a draft outright — nobody else was ever on it, so there's nothing to redistribute. */
  deleteDraft: (id: string) => void;

  /** Ends a Kick Break early, from the Creator Dashboard. No reward for anyone still on it — the
   *  whole point of the reward is finishing the full rotation, and this one didn't. */
  endKickBreak: (id: string) => void;
  /** Channel points for staying through an entire Kick Break, start to finish. Fires once the
   *  break completes its lap naturally — never from endKickBreak's early stop. */
  channelPointsNotice: ChannelPointsNotice | null;
  clearChannelPointsNotice: () => void;
};

const ExpeditionContext = createContext<ExpeditionContextValue | null>(null);

function stopSecondsFor(exp: Expedition) {
  return exp.stopDurationMode === "custom" ? (exp.stopDurationSeconds ?? STOP_DURATION_SECONDS) : STOP_DURATION_SECONDS;
}

/*
  Every expedition on the platform ticks forward on its own clock whether or not anyone in
  particular is riding it — the same reason a real raid is already moving before a given viewer
  joins it. `join`/`hopOff` only track which one "you" are currently attached to; they never
  pause or reset the clock for anyone else. Sits above the router (src/main.tsx), so the lobby
  list and the ride itself both read the same live state.
*/
export function ExpeditionProvider({
  livestreams,
  children,
}: {
  livestreams: Livestream[];
  children: ReactNode;
}) {
  const [expeditions, setExpeditions] = useState<Expedition[]>(() => createExpeditions(livestreams));
  const [riderExpeditionId, setRiderExpeditionIdState] = useState<string | null>(null);
  const [waitlistedExpeditionId, setWaitlistedExpeditionId] = useState<string | null>(null);
  const [provisionalRiderId, setProvisionalRiderId] = useState<string | null>(null);
  const [promotedNotice, setPromotedNotice] = useState<Expedition | null>(null);
  const [missedNotice, setMissedNotice] = useState<Expedition | null>(null);
  const [extraSlots, setExtraSlots] = useState(0);
  const [kicksBalance, setKicksBalance] = useState(KICKS_STARTING_BALANCE);
  const [endedNotice, setEndedNotice] = useState<EndedExpeditionNotice | null>(null);
  const [handoffNotice, setHandoffNotice] = useState<HandoffNotice | null>(null);
  const [kickedExpeditionIds, setKickedExpeditionIds] = useState<Set<string>>(() => new Set());
  const [channelPointsNotice, setChannelPointsNotice] = useState<ChannelPointsNotice | null>(null);

  // The tick interval below has to read the latest value of each of these from inside a
  // setInterval callback, the same ref-plus-state pattern KickVotePanel/NextStopVotePanel use —
  // otherwise it would keep acting on the values from whichever render first started it.
  const riderExpeditionIdRef = useRef(riderExpeditionId);
  riderExpeditionIdRef.current = riderExpeditionId;
  const waitlistedExpeditionIdRef = useRef(waitlistedExpeditionId);
  waitlistedExpeditionIdRef.current = waitlistedExpeditionId;
  const provisionalRiderIdRef = useRef(provisionalRiderId);
  provisionalRiderIdRef.current = provisionalRiderId;
  const expeditionsRef = useRef(expeditions);
  expeditionsRef.current = expeditions;

  function setRiderExpeditionId(id: string | null) {
    setRiderExpeditionIdState(id);
    // Claiming a spot, directly or off the waitlist, always resolves both — there's only ever
    // one expedition "you" can be attached to at a time in this model.
    if (id !== null) {
      setWaitlistedExpeditionId(null);
      setProvisionalRiderId(null);
    }
  }

  // Running your own expedition (or Kick Break) takes the attention a leader owes it — you can
  // still open another one to look at it, but joining or waitlisting onto it as a rider is
  // refused while one of your own is live. Your own expedition never counts against itself here,
  // so join(id) still works the moment you land on the one you just created.
  const blockedByOwnExpedition = useCallback(
    (id: string): boolean => {
      const target = expeditions.find((e) => e.id === id);
      if (target?.createdByViewer) return false;
      return expeditions.some((e) => e.createdByViewer && !e.isDraft && e.id !== id);
    },
    [expeditions],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      // Decided once per expedition per tick, ahead of the state updater below, so the
      // "did a seat free up" decision and the promotion/viewer-count consequence of it never
      // disagree with each other.
      const dropOffDecisions = new Map<string, boolean>();
      let promoted: Expedition | null = null;
      let missed: Expedition | null = null;
      // A Kick Break never loops — one lap through its fixed, streamer-picked rotation and it's
      // done, unlike every other expedition kind. Detected here, ahead of the state updater,
      // same reasoning as promoted/missed above: whether "you" earn the stay-the-whole-break
      // reward can't disagree with whether it actually ended this tick.
      const completingKickBreaks: Expedition[] = [];

      for (const exp of expeditionsRef.current) {
        if (exp.isDraft) continue;
        if (exp.transitionUntil !== null && Date.now() < exp.transitionUntil) continue;
        if ((exp.stopDurationMode === "whole-stream" || exp.stopDurationMode === "chat") && exp.status === "in-progress") continue;
        // Frozen on its current stop the whole time — Expedition.tsx's own countdown ends it a
        // few seconds after you arrive, so its stop can never be left to also advance underneath
        // that countdown, which would otherwise let the two disagree about which stream it ends on.
        if (exp.id === ENDING_SOON_DEMO_EXPEDITION_ID) continue;

        if (exp.status === "boarding" && exp.viewerCount >= exp.maxViewers) {
          const dropsOff = Math.random() < DROP_OFF_CHANCE_PER_TICK;
          dropOffDecisions.set(exp.id, dropsOff);
          if (dropsOff && waitlistedExpeditionIdRef.current === exp.id) promoted = exp;
        }

        if (exp.status === "boarding" && exp.secondsRemaining <= 1) {
          // A provisional spot nobody confirmed in time — it goes to someone else instead,
          // never to "you."
          if (provisionalRiderIdRef.current === exp.id && riderExpeditionIdRef.current !== exp.id) {
            missed = exp;
          }
        }

        if (
          exp.kind === "kick-break" &&
          exp.secondsRemaining <= 1 &&
          exp.stopIndex + 1 >= exp.stops.length
        ) {
          completingKickBreaks.push(exp);
        }
      }

      const completingIds = new Set(completingKickBreaks.map((exp) => exp.id));

      setExpeditions((prev) =>
        prev
          .filter((exp) => !completingIds.has(exp.id))
          .map((exp) => {
            if (exp.isDraft) return exp;
            if (exp.transitionUntil !== null && Date.now() < exp.transitionUntil) return exp;

            // "Whole stream" and "decide in chat" never auto-advance on a timer once under way —
            // the only ways off a stop are a resolved chat vote (move-on or next-stop) or "Stay
            // and watch" (leaving the expedition).
            if (
              (exp.stopDurationMode === "whole-stream" || exp.stopDurationMode === "chat") &&
              exp.status === "in-progress"
            )
              return exp;

            if (exp.id === ENDING_SOON_DEMO_EXPEDITION_ID) return exp;

            if (exp.status === "boarding" && exp.viewerCount >= exp.maxViewers) {
              const dropsOff = dropOffDecisions.get(exp.id) ?? false;
              // Promoted: the freed seat goes straight to the real viewer waiting on it, so the
              // mocked crowd's headcount doesn't actually change.
              if (dropsOff && promoted?.id !== exp.id) {
                return { ...exp, viewerCount: exp.viewerCount - 1 };
              }
            }

            if (exp.secondsRemaining > 1) {
              return { ...exp, secondsRemaining: exp.secondsRemaining - 1, transitionUntil: null };
            }

            if (exp.status === "boarding") {
              // The one seeded expedition that demos the waiting room never actually departs —
              // its countdown just loops, permanently boarding, rather than transitioning like
              // every other expedition eventually does.
              if (exp.id === WAITING_ROOM_DEMO_EXPEDITION_ID) {
                return { ...exp, secondsRemaining: 20 + Math.floor(Math.random() * 45) };
              }
              return {
                ...exp,
                status: "in-progress",
                stopIndex: 0,
                secondsRemaining: stopSecondsFor(exp),
                transitionUntil: Date.now() + TRANSITION_MS,
              };
            }

            // A chat-decided route with nothing past the current stop yet: hold here and keep
            // checking every tick, rather than wrapping back to stop 0 — there's no "back" to
            // wrap to until a vote actually appends one.
            if (exp.streamerSelectionMode === "chat" && exp.stopIndex + 1 >= exp.stops.length) {
              return { ...exp, secondsRemaining: 1 };
            }

            return {
              ...exp,
              stopIndex: (exp.stopIndex + 1) % exp.stops.length,
              secondsRemaining: stopSecondsFor(exp),
              transitionUntil: Date.now() + TRANSITION_MS,
            };
          }),
      );

      if (promoted) {
        setWaitlistedExpeditionId(null);
        setProvisionalRiderId(promoted.id);
        setPromotedNotice(promoted);
      }
      if (missed) {
        setProvisionalRiderId(null);
        setMissedNotice(missed);
      }
      for (const exp of completingKickBreaks) {
        // Riding it the moment it completes its lap is exactly "stayed the whole break" — hopping
        // off any earlier already cleared riderExpeditionId, so this can't over-credit.
        const stayedWholeBreak = riderExpeditionIdRef.current === exp.id;
        if (stayedWholeBreak) setRiderExpeditionIdState(null);
        if (waitlistedExpeditionIdRef.current === exp.id) setWaitlistedExpeditionId(null);
        if (provisionalRiderIdRef.current === exp.id) setProvisionalRiderId(null);
        if (stayedWholeBreak) {
          setChannelPointsNotice({
            amount: KICK_BREAK_REWARD_POINTS,
            streamerName: exp.originStreamerSlug ?? exp.creator,
          });
        }
      }
    }, TICK_MS);

    return () => window.clearInterval(timer);
  }, []);

  const value = useMemo<ExpeditionContextValue>(
    () => ({
      expeditions,
      riderExpeditionId,
      join: (id) => {
        if (kickedExpeditionIds.has(id) || blockedByOwnExpedition(id)) return;
        setRiderExpeditionId(id);
      },
      blockedByOwnExpedition,
      hopOff: () => setRiderExpeditionIdState(null),
      currentStop: (expedition) => expedition.stops[expedition.stopIndex],
      createExpedition: (expedition) => setExpeditions((prev) => [...prev, expedition]),
      updateExpedition: (id, expedition) =>
        setExpeditions((prev) => prev.map((e) => (e.id === id ? { ...expedition, id } : e))),
      // 1min/custom duration: just append — the existing timer carries the ride there naturally
      // when the current stop's clock runs out, same as any other stop change. Whole-stream and
      // chat-decided duration have no timer to do that, so there the vote resolving is what
      // moves everyone, right now.
      appendStop: (expeditionId, stream) =>
        setExpeditions((prev) =>
          prev.map((exp) => {
            if (exp.id !== expeditionId) return exp;
            const stops = [...exp.stops, stream];
            if (exp.stopDurationMode === "whole-stream" || exp.stopDurationMode === "chat") {
              return {
                ...exp,
                stops,
                stopIndex: stops.length - 1,
                secondsRemaining: stopSecondsFor(exp),
                transitionUntil: Date.now() + TRANSITION_MS,
              };
            }
            return { ...exp, stops };
          }),
        ),
      // A "move on now" vote resolving yes, for a pre-built route: jump to the next stop right
      // away, wrapping back to the start once the route runs out. A chat-picked route goes
      // through the next-stop vote instead (see Expedition.tsx's resolveMoveOnVote), never this.
      advanceStop: (expeditionId) =>
        setExpeditions((prev) =>
          prev.map((exp) => {
            if (exp.id !== expeditionId) return exp;
            const hasNext = exp.stopIndex + 1 < exp.stops.length;
            return {
              ...exp,
              stopIndex: hasNext ? exp.stopIndex + 1 : 0,
              secondsRemaining: stopSecondsFor(exp),
              transitionUntil: Date.now() + TRANSITION_MS,
            };
          }),
        ),

      waitlistedExpeditionId,
      joinWaitlist: (id) => {
        if (kickedExpeditionIds.has(id) || blockedByOwnExpedition(id)) return;
        setWaitlistedExpeditionId(id);
      },
      leaveWaitlist: () => setWaitlistedExpeditionId(null),
      kickedExpeditionIds,
      markKicked: (id) => setKickedExpeditionIds((prev) => new Set(prev).add(id)),
      provisionalRiderId,
      promotedNotice,
      clearPromotedNotice: () => setPromotedNotice(null),
      missedNotice,
      clearMissedNotice: () => setMissedNotice(null),

      handOffLeadership: (id, newLeader) => {
        const handingOff = expeditionsRef.current.find((e) => e.id === id);
        if (!handingOff) return;
        setExpeditions((prev) =>
          prev.map((e) =>
            e.id === id ? { ...e, creator: newLeader, createdByViewer: false, wasHandedOff: true } : e,
          ),
        );
        setHandoffNotice({ expeditionName: handingOff.name, newLeader });
      },
      handoffNotice,
      clearHandoffNotice: () => setHandoffNotice(null),

      endExpedition: (id) => {
        const current = expeditionsRef.current;
        const ending = current.find((e) => e.id === id);
        if (!ending) return undefined;

        const pourStream =
          ending.endBehavior === "specific-streamer"
            ? (ending.stops.find((s) => s.channel.slug === ending.endStreamerSlug) ?? ending.stops[ending.stopIndex])
            : ending.endBehavior === "chat-decides"
              ? ending.stops[Math.floor(Math.random() * ending.stops.length)]
              : ending.stops[ending.stopIndex];

        // Minus "you" — only the rest of the mocked crowd is what "poured" counts.
        const pouredCount = Math.max(0, ending.viewerCount - 1);

        setExpeditions((prev) => prev.filter((e) => e.id !== id));

        if (riderExpeditionIdRef.current === id) setRiderExpeditionIdState(null);
        if (waitlistedExpeditionIdRef.current === id) setWaitlistedExpeditionId(null);
        if (provisionalRiderIdRef.current === id) setProvisionalRiderId(null);

        setEndedNotice({
          endedName: ending.name,
          pouredInto: pourStream?.channel.username ?? null,
          pouredCount,
        });

        return pourStream;
      },
      maxConcurrentCreated: 1 + extraSlots,
      kicksBalance,
      purchaseExtraSlot: () => {
        if (kicksBalance < EXTRA_SLOT_COST) return false;
        setKicksBalance((bal) => bal - EXTRA_SLOT_COST);
        setExtraSlots((slots) => slots + 1);
        return true;
      },
      spendKicks: (amount) => {
        if (kicksBalance < amount) return false;
        setKicksBalance((bal) => bal - amount);
        return true;
      },
      endedNotice,
      clearEndedNotice: () => setEndedNotice(null),

      deleteDraft: (id) => setExpeditions((prev) => prev.filter((e) => e.id !== id)),

      endKickBreak: (id) => {
        setExpeditions((prev) => prev.filter((e) => e.id !== id));
        if (riderExpeditionIdRef.current === id) setRiderExpeditionIdState(null);
      },
      channelPointsNotice,
      clearChannelPointsNotice: () => setChannelPointsNotice(null),
    }),
    [
      expeditions,
      riderExpeditionId,
      blockedByOwnExpedition,
      waitlistedExpeditionId,
      provisionalRiderId,
      promotedNotice,
      missedNotice,
      extraSlots,
      kicksBalance,
      endedNotice,
      handoffNotice,
      kickedExpeditionIds,
      channelPointsNotice,
    ],
  );

  return <ExpeditionContext.Provider value={value}>{children}</ExpeditionContext.Provider>;
}

export function useExpeditions(): ExpeditionContextValue {
  const ctx = useContext(ExpeditionContext);
  if (!ctx) throw new Error("useExpeditions must be used within ExpeditionProvider");
  return ctx;
}
