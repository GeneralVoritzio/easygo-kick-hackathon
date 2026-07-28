import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Icon } from "../Icon";
import { currentUser, livestreams, profileFor, type Livestream } from "../mock/api";
import { useExpeditions } from "../expedition/ExpeditionContext";
import { useExplorerChat } from "../expedition/useExplorerChat";
import { StopPreview } from "../expedition/StopPreview";
import { AudioFocusButton } from "../expedition/AudioFocusButton";
import { KickVotePanel } from "../expedition/KickVotePanel";
import { NextStopVotePanel } from "../expedition/NextStopVotePanel";
import { MoveOnVotePanel } from "../expedition/MoveOnVotePanel";
import {
  KICK_VOTE_DURATION_SECONDS,
  randomKickVoteTarget,
  pickVoteCandidates,
  formatCountdown,
  findHandoffCandidates,
  KICK_VOTE_DEMO_EXPEDITION_ID,
  ENDING_SOON_DEMO_EXPEDITION_ID,
} from "../expedition/data";
import { KICK_VOTE_SAVE_COST, SUGGEST_STOP_COST } from "../expedition/ExpeditionContext";
import { ChatFeed } from "../components/ChannelChat";
import { ChannelBar } from "../components/ChannelBar";
import { ChannelAboutCard } from "../components/ChannelSections";

const NEXT_STOP_VOTE_SECONDS = 20;
const MOVE_ON_VOTE_SECONDS = 20;
// Nobody wants to be asked "move on?" the instant they arrive, or again the second the last
// vote failed — a settle-in period after arriving, and a cooldown after a "stay," keep the
// question from feeling like it never stops popping up.
const MOVE_ON_GRACE_SECONDS = 25;
const MOVE_ON_COOLDOWN_SECONDS = 45;

/*
  The ride itself. Boarding shows the departure countdown and the first stop as a preview, not
  yet playing — matching the lobby's "Departs in Xs." Once under way, every stop gets a real
  ~1-minute watch with its own countdown to the next one, and every departure holds on a transit
  screen for a couple of seconds rather than cutting straight to the next video. "Stay here" hops
  off the expedition and lands on that streamer's own watch page and main chat. Ported from
  kick-web-redesign's ExpeditionPage.tsx, with Kick Boss, Donate, reaction bursts and the floating
  QuickActionsWidget dropped — Kick Vote came along, everything else still isn't part of
  Expedition itself.
*/

type KickVoteState = {
  targetName: string;
  /** Rare, but the mocked crowd can put "you" up for a Kick Vote too — that's the only case
   *  with a real consequence, and the only one that can be paid off (see KickSelfState). */
  targetIsMe: boolean;
  yes: number;
  no: number;
  endsAt: number;
  myVote: "yes" | "no" | null;
  resolved: boolean;
};

// What happens when a Kick Vote against "you" passes: idle the rest of the time, then a decision
// window — pay to survive it, or accept it and hop to another stream — that defaults to leaving
// if it runs out unanswered.
type KickSelfState = { kind: "idle" } | { kind: "prompt"; secondsLeft: number };
const KICK_SELF_DECISION_SECONDS = 15;

// The ending-soon demo expedition doesn't just look like it's about to end — it actually does,
// a few seconds after you ride it, pouring everyone onto its last-shown stop. A real "decide the
// route in chat" or "whole stream" expedition never does this; this is the one seeded exception.
type ExpeditionEndingState = { kind: "idle" } | { kind: "counting"; secondsLeft: number };
const EXPEDITION_ENDING_DEMO_COUNTDOWN_SECONDS = 2;

type NextStopVoteState = {
  candidates: Livestream[];
  votes: number[];
  endsAt: number;
  myVoteIndex: number | null;
  resolved: boolean;
};

type MoveOnVoteState = {
  yes: number;
  no: number;
  endsAt: number;
  myVote: "yes" | "no" | null;
  resolved: boolean;
};

// What leadership transfer is doing right now: idle until you ask, then either a list to pick a
// new leader from, or — only once nobody is free to take over — the end-it fallback.
type LeadershipStep =
  | { kind: "idle" }
  | { kind: "picking"; candidates: string[]; selected: string }
  | { kind: "noCandidate" }
  | { kind: "confirmEnd" };

// A Kick Break's origin streamer never appears as the current stop once the rotation moves past
// them — this stands in for their own channel, offline banner and all, the same "brb" reasoning
// a real one already covers. Used both as the small picture-in-picture and, swapped, as the main
// view.
function KickBreakOriginBanner({ compact }: { compact: boolean }) {
  return (
    <>
      <img src={currentUser.offlineBanner} alt="" aria-hidden className="h-full w-full object-cover" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 p-1 text-center">
        <img
          src={currentUser.avatar}
          alt=""
          className={
            compact
              ? "size-6 shrink-0 rounded-full border border-white/50"
              : "size-14 shrink-0 rounded-full border-2 border-white/60"
          }
        />
        <span className={`font-bold uppercase tracking-wide text-primary-base ${compact ? "text-[9px]" : "text-sm"}`}>
          Kick Break
        </span>
        {!compact && <span className="text-xs text-white/80">{currentUser.username} is on a break</span>}
      </div>
    </>
  );
}

export function Expedition() {
  const { id } = useParams<{ id: string }>();
  const {
    expeditions,
    riderExpeditionId,
    join,
    hopOff,
    currentStop,
    appendStop,
    advanceStop,
    handOffLeadership,
    endExpedition,
    kicksBalance,
    spendKicks,
    markKicked,
    kickedExpeditionIds,
  } = useExpeditions();
  const navigate = useNavigate();
  const [leadershipStep, setLeadershipStep] = useState<LeadershipStep>({ kind: "idle" });
  const [kickSelf, setKickSelf] = useState<KickSelfState>({ kind: "idle" });
  const [expeditionEnding, setExpeditionEnding] = useState<ExpeditionEndingState>({ kind: "idle" });
  // A one-off line dropped into the current stop's own Main Chat from outside — kick-vote
  // outcomes and someone leaving to watch solo, mirrored there as well as Explorer Chat, keyed
  // by id so ChatFeed never appends the same event twice.
  const [mainChatAnnouncement, setMainChatAnnouncement] = useState<{ id: string; body: string } | null>(null);
  function announceInMainChat(body: string) {
    setMainChatAnnouncement({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, body });
  }

  const expedition = expeditions.find((e) => e.id === id);
  const stops = expedition?.stops ?? [];
  const status = expedition?.status ?? "boarding";
  const stopIndex = expedition?.stopIndex ?? 0;
  const current = expedition ? currentStop(expedition) : undefined;
  const stageKey = status === "boarding" ? "boarding" : `stop-${stopIndex}`;
  const displayName =
    status === "boarding" ? (stops[0]?.channel.username ?? "") : (current?.channel.username ?? "");

  const { messages, sendMessage, sendSystemMessage } = useExplorerChat(id ?? "", stageKey, displayName);
  const [muted, setMuted] = useState(true);
  const [draft, setDraft] = useState("");
  const [chatTab, setChatTab] = useState<"explorer" | "stream">("explorer");
  // Which one is big: the rotation (default) or the origin streamer's own picture-in-picture.
  // Toggled from the PiP itself, never resets on its own — swapping stops shouldn't un-swap it.
  const [kickBreakViewSwapped, setKickBreakViewSwapped] = useState(false);
  // A Kick Break's origin streamer never appears as the current stop once the rotation moves
  // past them, so the usual ChannelBar (which only ever shows for the current stop) can't be
  // where support for them lives — this compact row is, right beside their pinned chat.
  const [originFollowing, setOriginFollowing] = useState(false);
  const [originSubscribed, setOriginSubscribed] = useState(false);
  const [kickVote, setKickVoteState] = useState<KickVoteState | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const kickVoteRef = useRef<KickVoteState | null>(null);

  // Same ref-plus-state pattern the tick interval below needs: the vote's resolution has to read
  // the latest value from inside a setInterval callback, and calling sendSystemMessage from
  // inside a setState updater (instead of the interval body directly) would be the impurity that
  // duplicates a chat line.
  const setKickVote = (vote: KickVoteState | null) => {
    kickVoteRef.current = vote;
    setKickVoteState(vote);
  };

  // Switching your vote moves your one tally from the old choice to the new one instead of
  // being blocked outright — you can change your mind as many times as you like before the
  // clock runs out.
  const castVote = (choice: "yes" | "no") => {
    const currentVote = kickVoteRef.current;
    if (!currentVote || currentVote.resolved || currentVote.myVote === choice) return;
    let { yes, no } = currentVote;
    if (currentVote.myVote === "yes") yes -= 1;
    else if (currentVote.myVote === "no") no -= 1;
    if (choice === "yes") yes += 1;
    else no += 1;
    setKickVote({ ...currentVote, myVote: choice, yes, no });
  };

  // Announces the outcome — called either when the clock genuinely runs out, or when a stop
  // change is about to replace the vote early. A "kicked" outcome names a real destination
  // pulled from this same expedition's own stops, so it reads as an actual consequence rather
  // than a line that changes nothing. When the target is "you", it isn't final yet — a decision
  // window (pay Kicks to survive, or accept it) opens instead of dropping you straight out.
  const resolveVote = (vote: KickVoteState) => {
    // Always resolves as kicked here, tally aside — targetIsMe is only ever true on the one
    // seeded expedition set aside to demo this reliably, so it has to actually show every time,
    // never lose to a random tie or a "survives" tally.
    if (vote.targetIsMe) {
      sendSystemMessage("🥾 Chat voted to kick you off the expedition!");
      announceInMainChat("🥾 Chat just voted to kick the viewer off the expedition!");
      setKickSelf({ kind: "prompt", secondsLeft: KICK_SELF_DECISION_SECONDS });
      return;
    }
    if (vote.yes === vote.no) {
      sendSystemMessage(`It's a tie — ${vote.targetName} stays, nothing happens.`);
      return;
    }
    const kicked = vote.yes > vote.no;
    if (!kicked) {
      sendSystemMessage(`${vote.targetName} survives the vote.`);
      return;
    }
    const destination = stops[Math.floor(Math.random() * stops.length)];
    sendSystemMessage(
      `🥾 ${vote.targetName} has been kicked off the expedition and dropped into ${destination.channel.username}'s stream!`,
    );
    announceInMainChat(
      `🥾 ${vote.targetName} just got voted off an expedition and crash-landed in ${destination.channel.username}'s stream!`,
    );
  };

  // resolveVote closes over sendSystemMessage, which useExplorerChat returns as a new function
  // every render — Explorer Chat itself re-renders every 1-3s from the ambient message
  // generator. The resolution interval must survive across those renders, so it reaches into
  // this ref for the latest resolveVote instead of taking it as a dependency.
  const resolveVoteRef = useRef(resolveVote);
  resolveVoteRef.current = resolveVote;

  // The Kicks payment survives the vote — it stays exactly like anyone else's "no" would have.
  function payToStayInVote() {
    if (!spendKicks(KICK_VOTE_SAVE_COST)) return;
    sendSystemMessage(`${currentUser.username} paid ${KICK_VOTE_SAVE_COST} Kicks to survive the vote!`);
    setKickSelf({ kind: "idle" });
  }

  // Accepting the vote (or letting the decision window run out) is permanent: this expedition
  // goes on the kicked list, so join()/joinWaitlist() both refuse it from now on, and the lobby's
  // own card shows why. Drops you into a random stop's own stream, same destination flavour as a
  // mocked chatter's kick.
  function leaveKickedExpedition() {
    if (!expedition) return;
    markKicked(expedition.id);
    // "Continue on this stream" — the current stop, not a random one from the route, matching
    // the decision prompt's own wording. Falls back to any other real stop on the route (never
    // an empty route while riding one), so this always lands on a real, live channel.
    const destination = current ?? stops[Math.floor(Math.random() * stops.length)];
    hopOff();
    setKickSelf({ kind: "idle" });
    navigate(destination ? `/${destination.channel.slug}` : "/expeditions", {
      state: destination
        ? { chatNotice: `🥾 ${currentUser.username} just got kicked off an expedition and crash-landed here!` }
        : undefined,
    });
  }

  // Only a custom expedition that chose "decide the route in chat" ever has one of these: the
  // route has no fixed next stop, so the group votes on it instead.
  const isChatMode = expedition?.streamerSelectionMode === "chat";
  const [nextStopVote, setNextStopVoteState] = useState<NextStopVoteState | null>(null);
  const nextStopVoteRef = useRef<NextStopVoteState | null>(null);

  const setNextStopVote = (vote: NextStopVoteState | null) => {
    nextStopVoteRef.current = vote;
    setNextStopVoteState(vote);
  };

  const startNextStopVote = () => {
    if (!expedition) return;
    const candidates = pickVoteCandidates(expedition.stops, livestreams, 3);
    if (!candidates.length) return;
    setNextStopVote({
      candidates,
      votes: candidates.map(() => 1 + Math.floor(Math.random() * 3)),
      endsAt: Date.now() + NEXT_STOP_VOTE_SECONDS * 1000,
      myVoteIndex: null,
      resolved: false,
    });
  };

  const castNextStopVote = (index: number) => {
    const currentVote = nextStopVoteRef.current;
    if (!currentVote || currentVote.resolved || currentVote.myVoteIndex === index) return;
    const votes = [...currentVote.votes];
    if (currentVote.myVoteIndex !== null) votes[currentVote.myVoteIndex] -= 1;
    votes[index] += 1;
    setNextStopVote({ ...currentVote, votes, myVoteIndex: index });
  };

  // The vote's own options are random by default (pickVoteCandidates) — naming a specific
  // streamer instead is a paid write-in, not a free option, so it spends Kicks before it's added.
  const suggestNextStop = (stream: Livestream) => {
    const currentVote = nextStopVoteRef.current;
    if (!currentVote || currentVote.resolved) return;
    if (!spendKicks(SUGGEST_STOP_COST)) return;
    const votes = [...currentVote.votes];
    if (currentVote.myVoteIndex !== null) votes[currentVote.myVoteIndex] -= 1;
    const candidates = [...currentVote.candidates, stream];
    votes.push(1);
    setNextStopVote({ ...currentVote, candidates, votes, myVoteIndex: candidates.length - 1 });
    sendSystemMessage(`${currentUser.username} spent ${SUGGEST_STOP_COST} Kicks to add ${stream.channel.username} to the vote!`);
  };

  // The winner becomes a real stop on the route (appendStop), named in Explorer Chat so it
  // reads as an actual consequence of the vote, the same reasoning resolveVote above follows
  // for Kick Vote.
  const resolveNextStopVote = (vote: NextStopVoteState) => {
    if (!expedition) return;
    const topVotes = Math.max(...vote.votes);
    const leaders = vote.votes.filter((v) => v === topVotes).length;
    if (leaders > 1) {
      sendSystemMessage("It's a tie — chat couldn't agree on where to go next.");
      return;
    }
    const winnerIndex = vote.votes.indexOf(topVotes);
    const winner = vote.candidates[winnerIndex];
    appendStop(expedition.id, winner);
    sendSystemMessage(`Chat picked ${winner.channel.username} as the next stop!`);
  };

  const resolveNextStopVoteRef = useRef(resolveNextStopVote);
  resolveNextStopVoteRef.current = resolveNextStopVote;

  // Only a "decide in chat" stop duration ever has one of these: there's no fixed timer, so the
  // crowd periodically votes on whether to move to the next stop right now.
  const isChatDuration = expedition?.stopDurationMode === "chat";
  const [moveOnVote, setMoveOnVoteState] = useState<MoveOnVoteState | null>(null);
  const moveOnVoteRef = useRef<MoveOnVoteState | null>(null);
  // Earliest time the next vote is allowed to start — set to "later" right after arriving at a
  // stop (a grace period) and right after a failed resolution, a stay or a tie (a cooldown), so
  // the question doesn't come right back the moment it's answered. Also state, not just a ref:
  // the manual "Vote to move on" button reads it too, to disable itself and show a countdown.
  const moveOnEligibleAtRef = useRef(0);
  const [moveOnEligibleAt, setMoveOnEligibleAtState] = useState(0);
  const setMoveOnEligibleAt = (at: number) => {
    moveOnEligibleAtRef.current = at;
    setMoveOnEligibleAtState(at);
  };

  const setMoveOnVote = (vote: MoveOnVoteState | null) => {
    moveOnVoteRef.current = vote;
    setMoveOnVoteState(vote);
  };

  const startMoveOnVote = () => {
    setMoveOnVote({
      yes: 1 + Math.floor(Math.random() * 3),
      no: 1 + Math.floor(Math.random() * 3),
      endsAt: Date.now() + MOVE_ON_VOTE_SECONDS * 1000,
      myVote: null,
      resolved: false,
    });
  };

  const castMoveOnVote = (choice: "yes" | "no") => {
    const currentVote = moveOnVoteRef.current;
    if (!currentVote || currentVote.resolved || currentVote.myVote === choice) return;
    let { yes, no } = currentVote;
    if (currentVote.myVote === "yes") yes -= 1;
    else if (currentVote.myVote === "no") no -= 1;
    if (choice === "yes") yes += 1;
    else no += 1;
    setMoveOnVote({ ...currentVote, myVote: choice, yes, no });
  };

  // One vote leads straight into the other: passing "move on?" either jumps immediately along
  // the pre-built route, or — when the route itself is chat-picked — starts the "who's next"
  // vote right then, fresh every time. Failing just holds here — the same question comes back
  // after a cooldown, not immediately.
  const resolveMoveOnVote = (vote: MoveOnVoteState) => {
    if (!expedition) return;
    if (vote.yes === vote.no) {
      sendSystemMessage("It's a tie — nobody's moving on for now.");
      return;
    }
    if (vote.yes < vote.no) {
      sendSystemMessage("Chat voted to stay a bit longer.");
      return;
    }
    if (expedition.streamerSelectionMode === "chat") {
      sendSystemMessage("Chat voted to move on — picking the next stream now!");
      startNextStopVote();
      return;
    }
    advanceStop(expedition.id);
    sendSystemMessage("Chat voted to move on!");
  };

  const resolveMoveOnVoteRef = useRef(resolveMoveOnVote);
  resolveMoveOnVoteRef.current = resolveMoveOnVote;

  useEffect(() => {
    if (id && riderExpeditionId !== id) join(id);
  }, [id, riderExpeditionId, join]);

  useEffect(() => {
    setMuted(true);
  }, [current?.channel.slug]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  // A fresh Kick Vote starts the moment a new stop begins (never while boarding, and never at
  // all when the expedition doesn't allow kicking — there's no crowd to vote yet, or nothing to
  // vote on). If the previous vote hadn't resolved yet, it's resolved right now instead of
  // silently discarded.
  useEffect(() => {
    const previous = kickVoteRef.current;
    if (previous && !previous.resolved) resolveVote(previous);

    if (status === "boarding" || !expedition?.allowKicking) {
      setKickVote(null);
      return;
    }
    // Only ever "you" on the one seeded expedition set aside to demo it reliably — never a
    // random chance on any other expedition, per the user's answer.
    const targetIsMe = expedition?.id === KICK_VOTE_DEMO_EXPEDITION_ID;
    setKickVote({
      targetName: targetIsMe ? currentUser.username : randomKickVoteTarget(),
      targetIsMe,
      yes: 1 + Math.floor(Math.random() * 3),
      no: 1 + Math.floor(Math.random() * 3),
      endsAt: Date.now() + KICK_VOTE_DURATION_SECONDS * 1000,
      myVote: null,
      resolved: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageKey]);

  // The mocked crowd keeps voting until time's up, then the vote resolves into a line in
  // Explorer Chat. Empty deps: this must keep running on the same 1s tick for the vote's whole
  // lifetime, not get torn down and restarted by Explorer Chat's own frequent re-renders.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const currentVote = kickVoteRef.current;
      if (!currentVote || currentVote.resolved) return;
      const now = Date.now();

      if (now >= currentVote.endsAt) {
        resolveVoteRef.current(currentVote);
        setKickVote({ ...currentVote, resolved: true });
      } else {
        const yes = currentVote.yes + (Math.random() < 0.35 ? 1 : 0);
        const no = currentVote.no + (Math.random() < 0.25 ? 1 : 0);
        if (yes !== currentVote.yes || no !== currentVote.no) {
          setKickVote({ ...currentVote, yes, no });
        }
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Auto-starts a fresh next-stop vote the moment a new stop begins, but only when there's a
  // real timer that will eventually carry the ride there. Whole-stream and chat-decided
  // duration have no timer — there, the next-stop vote only ever starts as the direct result of
  // a "move on?" vote passing (see resolveMoveOnVote), never on its own. Skipped entirely once a
  // vote from an earlier stop has already appended the next one (stopIndex + 1 < stops.length):
  // nothing left to decide until that stop is actually reached.
  useEffect(() => {
    if (!expedition || !isChatMode || status === "boarding") return;
    if (expedition.stopDurationMode === "whole-stream" || expedition.stopDurationMode === "chat") return;
    if (expedition.stopIndex + 1 < expedition.stops.length) {
      setNextStopVote(null);
      return;
    }
    startNextStopVote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageKey, isChatMode]);

  // Same crowd-auto-vote tick pattern as Kick Vote above.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const currentVote = nextStopVoteRef.current;
      if (!currentVote || currentVote.resolved) return;
      const now = Date.now();

      if (now >= currentVote.endsAt) {
        resolveNextStopVoteRef.current(currentVote);
        setNextStopVote({ ...currentVote, resolved: true });
      } else if (Math.random() < 0.4) {
        const votes = [...currentVote.votes];
        votes[Math.floor(Math.random() * votes.length)] += 1;
        setNextStopVote({ ...currentVote, votes });
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // A new stop begins with a grace period before the manual "Vote to move on" button is even
  // clickable — only for a chat-decided stop duration; whole-stream mode has no such settle-in
  // period, since there's no automatic anything to guard against there.
  useEffect(() => {
    setMoveOnVote(null);
    setMoveOnEligibleAt(!expedition || !isChatDuration || status === "boarding" ? 0 : Date.now() + MOVE_ON_GRACE_SECONDS * 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageKey, isChatDuration]);

  // Same crowd-auto-vote tick pattern as Kick Vote above — but never starts one on its own. The
  // creator/leader's manual "Vote to move on" click is the only thing that ever starts a vote,
  // even for a chat-decided stop duration; this only resolves one already running, and a failed
  // vote (a clear "stay" or a tie) sets a cooldown so the button stays disabled for a bit
  // afterward instead of being clickable again immediately.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const currentVote = moveOnVoteRef.current;
      if (!currentVote || currentVote.resolved) return;
      const now = Date.now();

      if (now >= currentVote.endsAt) {
        resolveMoveOnVoteRef.current(currentVote);
        if (currentVote.yes > currentVote.no) {
          setMoveOnVote({ ...currentVote, resolved: true });
        } else {
          setMoveOnVote(null);
          setMoveOnEligibleAt(Date.now() + MOVE_ON_COOLDOWN_SECONDS * 1000);
        }
      } else {
        const yes = currentVote.yes + (Math.random() < 0.35 ? 1 : 0);
        const no = currentVote.no + (Math.random() < 0.25 ? 1 : 0);
        if (yes !== currentVote.yes || no !== currentVote.no) {
          setMoveOnVote({ ...currentVote, yes, no });
        }
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Only exists so the "Vote to move on" button's cooldown countdown updates once a second —
  // moveOnEligibleAt itself only changes when a vote starts or fails, not every second.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Self-rescheduling countdown — defaults to leaving if the decision window runs out with no
  // answer, same as accepting it outright.
  useEffect(() => {
    if (kickSelf.kind !== "prompt") return;
    if (kickSelf.secondsLeft <= 0) {
      leaveKickedExpedition();
      return;
    }
    const timer = window.setTimeout(() => {
      setKickSelf((prev) => (prev.kind === "prompt" ? { ...prev, secondsLeft: prev.secondsLeft - 1 } : prev));
    }, 1000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kickSelf]);

  // A Kick Break ends itself once its lap completes (ExpeditionContext's tick loop), unlike
  // every other expedition kind, which only ever disappears via an explicit action on this same
  // page. Riding one that vanishes out from under you this way means it's back at the main
  // streamer already — the channel points toast (if you stayed the whole time) is global, so it
  // still shows up here regardless.
  const wasKickBreakRef = useRef(false);
  if (expedition?.kind === "kick-break") wasKickBreakRef.current = true;
  useEffect(() => {
    if (!expedition && wasKickBreakRef.current) {
      wasKickBreakRef.current = false;
      navigate("/");
    }
  }, [expedition, navigate]);

  // The one seeded expedition that really does end shortly after you ride it — starts the
  // countdown once, the moment you arrive, rather than once per stop.
  useEffect(() => {
    if (expedition?.id === ENDING_SOON_DEMO_EXPEDITION_ID) {
      setExpeditionEnding({ kind: "counting", secondsLeft: EXPEDITION_ENDING_DEMO_COUNTDOWN_SECONDS });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Self-rescheduling countdown, same shape as kickSelf's above — pours everyone onto the
  // current stop (this expedition's endBehavior is "last-stream") and announces it before
  // navigating away, since the expedition (and its chat) won't exist to announce into after.
  useEffect(() => {
    if (expeditionEnding.kind !== "counting") return;
    if (expeditionEnding.secondsLeft <= 0) {
      if (expedition) {
        sendSystemMessage(`Everyone from ${expedition.name} has dropped off!`);
        announceInMainChat(`🌊 The whole ${expedition.name} crew just poured in here at once!`);
        const destination = endExpedition(expedition.id);
        hopOff();
        navigate(destination ? `/${destination.channel.slug}` : "/expeditions", {
          state: destination
            ? { chatNotice: `🌊 The whole ${expedition.name} crew just poured in here at once!` }
            : undefined,
        });
      }
      setExpeditionEnding({ kind: "idle" });
      return;
    }
    const timer = window.setTimeout(() => {
      setExpeditionEnding((prev) => (prev.kind === "counting" ? { ...prev, secondsLeft: prev.secondsLeft - 1 } : prev));
    }, 1000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expeditionEnding]);

  if (id && kickedExpeditionIds.has(id)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-subtle">You've been kicked off this expedition.</p>
        <Link to="/expeditions" className="text-sm font-semibold text-primary-base">
          Browse Expeditions
        </Link>
      </div>
    );
  }

  if (!expedition || !current) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-subtle">This expedition isn't available anymore.</p>
        <Link to="/expeditions" className="text-sm font-semibold text-primary-base">
          Browse Expeditions
        </Link>
      </div>
    );
  }

  const isTransitioning = expedition.transitionUntil !== null && Date.now() < expedition.transitionUntil;
  const isBoarding = status === "boarding";
  const isKickBreak = expedition.kind === "kick-break";
  const hasNext = stopIndex + 1 < stops.length;
  const next = hasNext ? stops[stopIndex + 1] : undefined;
  const isWholeStream = expedition.stopDurationMode === "whole-stream";
  const moveOnOnCooldown = moveOnEligibleAt > nowTick;
  const moveOnCooldownSeconds = Math.max(0, Math.ceil((moveOnEligibleAt - nowTick) / 1000));
  const profile = profileFor(current.channel.slug);
  const handoffCandidates = leadershipStep.kind === "picking" ? leadershipStep.candidates : [];
  const selectedCandidate = leadershipStep.kind === "picking" ? leadershipStep.selected : "";
  // Only ever true for an expedition "you" created or were handed off — createdByViewer already
  // means exactly that (handOffLeadership sets it false again if you hand yours off, and the
  // mocked crowd can never be handed one, only give one up). Every other expeditor is just a
  // viewer here, seeded or not. A Kick Break only ever ends from the Creator Dashboard
  // (endKickBreak), never this hand-off-or-end flow.
  const canManageLeadership = expedition.createdByViewer && expedition.kind !== "kick-break";

  function handleStayHere() {
    const funnyLine = `👋 ${currentUser.username} dipped from the expedition to watch ${current!.channel.username} solo. No loyalty.`;
    sendSystemMessage(funnyLine);
    announceInMainChat(funnyLine);
    hopOff();
    navigate(`/${current!.channel.slug}`);
  }

  function startLeadershipTransfer() {
    const candidates = findHandoffCandidates(expeditions, expedition!.id);
    setLeadershipStep(
      candidates.length > 0 ? { kind: "picking", candidates, selected: candidates[0] } : { kind: "noCandidate" },
    );
  }

  function confirmHandoff(candidate: string) {
    handOffLeadership(expedition!.id, candidate);
    setLeadershipStep({ kind: "idle" });
  }

  function confirmEnd() {
    const name = expedition!.name;
    const destination = endExpedition(expedition!.id);
    hopOff();
    navigate(destination ? `/${destination.channel.slug}` : "/expeditions", {
      state: destination ? { chatNotice: `🌊 The whole ${name} crew just poured in here at once!` } : undefined,
    });
  }

  return (
    <div className="-mb-6 flex h-[calc(100vh-var(--navbar-height))] w-full flex-col overflow-hidden lg:flex-row">
      {kickSelf.kind === "prompt" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-xl border border-outline-decorative bg-surface-highest p-6 text-center">
            <Icon name="expedition" className="size-7 text-primary-base" />
            <p className="text-sm font-bold text-white">Chat voted you off the expedition!</p>
            <p className="text-xs text-subtle">
              Pay {KICK_VOTE_SAVE_COST} Kicks to stay, or accept it and continue on this stream. Kicking you off
              in {kickSelf.secondsLeft}s.
            </p>
            <div className="flex w-full flex-col gap-2">
              <button
                type="button"
                onClick={payToStayInVote}
                disabled={kicksBalance < KICK_VOTE_SAVE_COST}
                className="rounded-lg bg-primary-base px-4 py-2 text-xs font-bold text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              >
                {kicksBalance < KICK_VOTE_SAVE_COST
                  ? `Need ${KICK_VOTE_SAVE_COST} Kicks`
                  : `Pay ${KICK_VOTE_SAVE_COST} Kicks to stay`}
              </button>
              <button
                type="button"
                onClick={leaveKickedExpedition}
                className="rounded-lg border border-outline-decorative px-4 py-2 text-xs font-bold text-white transition-colors betterhover:hover:bg-neutral-700"
              >
                Accept and leave
              </button>
            </div>
          </div>
        </div>
      )}
      {expeditionEnding.kind === "counting" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="flex w-full max-w-sm flex-col items-center gap-2 rounded-xl border border-outline-decorative bg-surface-highest p-6 text-center">
            <Icon name="expedition" className="size-7 animate-pulse text-primary-base" />
            <p className="text-sm font-bold text-white">{expedition.name} is wrapping up</p>
            <p className="text-xs text-subtle">
              Everyone's joining {current.channel.username}'s stream in{" "}
              <span className="tabular-nums font-semibold text-white">{expeditionEnding.secondsLeft}s</span>.
            </p>
          </div>
        </div>
      )}
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="relative aspect-video w-full shrink-0 bg-black lg:aspect-auto lg:flex-1">
          {isBoarding || isTransitioning ? (
            <div className="relative h-full w-full overflow-hidden">
              <img
                src={(isBoarding ? stops[0] : current).thumbnail}
                alt=""
                aria-hidden
                className="h-full w-full object-cover opacity-40 blur-sm"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 text-center">
                <Icon name="expedition" className="size-7 animate-pulse text-white" />
                <p className="text-sm font-bold text-white">
                  {isBoarding ? `Boarding · ${expedition.name}` : `Departing to ${current.channel.username}...`}
                </p>
                {isBoarding && (
                  <p className="text-xs text-subtle">First stop: {stops[0].channel.username}</p>
                )}
              </div>
            </div>
          ) : isKickBreak && kickBreakViewSwapped ? (
            <div className="relative h-full w-full overflow-hidden">
              <KickBreakOriginBanner compact={false} />
            </div>
          ) : (
            <StopPreview stream={current} />
          )}

          {!isBoarding && !isTransitioning && (
            <AudioFocusButton
              isAudioActive={!muted}
              streamName={current.channel.username}
              onFocus={() => setMuted((m) => !m)}
              className="absolute bottom-3 left-3"
            />
          )}

          {/* The rotation itself looks like any other expedition stop — this is what actually
              says "Kick Break": a picture-in-picture of the streamer you're really here for,
              off on their break, the same "brb" reasoning a real offline banner already covers.
              The toggle swaps which one is big, same as any real picture-in-picture. */}
          {isKickBreak && !isBoarding && !isTransitioning && (
            <div className="absolute bottom-3 right-3 flex w-28 flex-col overflow-hidden rounded-lg border-2 border-primary-base bg-black shadow-lg sm:w-36">
              <div className="relative aspect-video w-full">
                {kickBreakViewSwapped ? (
                  <StopPreview stream={current} />
                ) : (
                  <KickBreakOriginBanner compact />
                )}
                <button
                  type="button"
                  onClick={() => setKickBreakViewSwapped((v) => !v)}
                  aria-label="Swap views"
                  className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white transition-colors betterhover:hover:bg-black/80"
                >
                  <Icon name="pip" className="size-3" />
                </button>
              </div>
              <div className="truncate bg-black px-1.5 py-1 text-[10px] font-bold text-white">
                {kickBreakViewSwapped ? current.channel.username : `${currentUser.username} · On a break`}
              </div>
            </div>
          )}

          <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-outline-decorative bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
            <Icon name="expedition" className="size-3 text-primary-base" />
            {expedition.name}
            {!isBoarding && (
              <span className="tabular-nums text-subtle">
                {" "}
                · Stop {stopIndex + 1}/{stops.length}
              </span>
            )}
          </span>

          <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-outline-decorative bg-black/70 px-2.5 py-1 text-[11px] font-bold tabular-nums text-white backdrop-blur-sm">
            <Icon name="chatters" className="size-3 text-primary-base" />
            {expedition.viewerCount}/{expedition.maxViewers} expeditors
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-outline-decorative p-3 sm:p-4">
          <div className="min-w-0">
            <p className="tabular-nums text-xs font-semibold text-white">
              {isBoarding
                ? `Departing in ${formatCountdown(expedition.secondsRemaining)}`
                : isWholeStream
                  ? "Watching until the group moves on"
                  : isChatDuration
                    ? "Chat decides when to move on"
                    : `Next stop in ${formatCountdown(expedition.secondsRemaining)}`}
            </p>
            <p className="truncate text-xs text-subtle">
              {isBoarding ? (
                <>
                  Next: <span className="font-semibold text-white">{stops[0].channel.username}</span>
                </>
              ) : next ? (
                <>
                  Next: <span className="font-semibold text-white">{next.channel.username}</span>
                </>
              ) : nextStopVote && !nextStopVote.resolved ? (
                "Next: chat is still voting"
              ) : (
                "Next: chat decides who to watch next"
              )}
            </p>
            <p className="truncate text-[11px] text-subtle">
              By <span className="font-semibold text-white">{expedition.createdByViewer ? "you" : expedition.creator}</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {!isBoarding &&
              expedition.createdByViewer &&
              (isWholeStream || isChatDuration) &&
              (!moveOnVote || moveOnVote.resolved) &&
              (!nextStopVote || nextStopVote.resolved) && (
                <button
                  type="button"
                  onClick={startMoveOnVote}
                  disabled={moveOnOnCooldown}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg border border-outline-decorative px-3 py-2 text-xs font-bold transition-colors ${
                    moveOnOnCooldown
                      ? "cursor-not-allowed bg-secondary-base/40 text-subtle"
                      : "bg-secondary-base text-white betterhover:hover:bg-neutral-700"
                  }`}
                >
                  <Icon name="expedition" className="size-3.5" />
                  {moveOnOnCooldown ? `Vote to move on (${moveOnCooldownSeconds}s)` : "Vote to move on"}
                </button>
              )}
            {!isBoarding && !canManageLeadership && (
              <button
                type="button"
                onClick={handleStayHere}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-outline-decorative bg-secondary-base px-3 py-2 text-xs font-bold text-white transition-colors betterhover:hover:bg-neutral-700"
              >
                <Icon name="log-out" className="size-3.5" />
                Stay and watch {current.channel.username}
              </button>
            )}
            {canManageLeadership && leadershipStep.kind === "idle" && (
              <button
                type="button"
                onClick={startLeadershipTransfer}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-outline-decorative px-3 py-2 text-xs font-bold text-red-400 transition-colors betterhover:hover:bg-red-500/10"
              >
                Hand off leadership
              </button>
            )}
            {canManageLeadership && leadershipStep.kind === "picking" && (
              <>
                <span className="text-xs text-subtle">Hand off to</span>
                <select
                  value={selectedCandidate}
                  onChange={(e) =>
                    setLeadershipStep({ kind: "picking", candidates: handoffCandidates, selected: e.target.value })
                  }
                  className="h-9 rounded border border-outline-region bg-surface-lowest px-2 text-xs font-bold text-white outline-none focus:border-primary-base"
                >
                  {handoffCandidates.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => confirmHandoff(selectedCandidate)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-base px-3 py-2 text-xs font-bold text-primary-onPrimary transition-colors betterhover:hover:bg-green-400"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setLeadershipStep({ kind: "idle" })}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-outline-decorative bg-secondary-base px-3 py-2 text-xs font-bold text-white transition-colors betterhover:hover:bg-neutral-700"
                >
                  Cancel
                </button>
              </>
            )}
            {canManageLeadership && leadershipStep.kind === "noCandidate" && (
              <>
                <span className="text-xs text-subtle">Nobody's free to take over right now.</span>
                <button
                  type="button"
                  onClick={() => setLeadershipStep({ kind: "confirmEnd" })}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-outline-decorative px-3 py-2 text-xs font-bold text-red-400 transition-colors betterhover:hover:bg-red-500/10"
                >
                  End expedition instead
                </button>
                <button
                  type="button"
                  onClick={() => setLeadershipStep({ kind: "idle" })}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-outline-decorative bg-secondary-base px-3 py-2 text-xs font-bold text-white transition-colors betterhover:hover:bg-neutral-700"
                >
                  Cancel
                </button>
              </>
            )}
            {canManageLeadership && leadershipStep.kind === "confirmEnd" && (
              <>
                <span className="text-xs text-subtle">End for everyone?</span>
                <button
                  type="button"
                  onClick={confirmEnd}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-red-500/15 px-3 py-2 text-xs font-bold text-red-400 transition-colors betterhover:hover:bg-red-500/25"
                >
                  Yes, end it
                </button>
                <button
                  type="button"
                  onClick={() => setLeadershipStep({ kind: "idle" })}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-outline-decorative bg-secondary-base px-3 py-2 text-xs font-bold text-white transition-colors betterhover:hover:bg-neutral-700"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {!isBoarding && !isTransitioning && (
          <div className="flex shrink-0 flex-col gap-6 border-b border-outline-decorative px-4 py-5 lg:px-7">
            <ChannelBar stream={current} />
            {profile && <ChannelAboutCard profile={profile} />}
          </div>
        )}
      </div>

      <div className="hidden shrink-0 flex-col border-outline-decorative lg:flex lg:h-full lg:w-80 lg:border-l">
        {expedition.allowKicking && kickVote && !kickVote.resolved && (
          <KickVotePanel
            targetName={kickVote.targetName}
            yes={kickVote.yes}
            no={kickVote.no}
            endsAt={kickVote.endsAt}
            myVote={kickVote.myVote}
            onVote={castVote}
          />
        )}
        {nextStopVote && !nextStopVote.resolved && (
          <NextStopVotePanel
            candidates={nextStopVote.candidates}
            votes={nextStopVote.votes}
            endsAt={nextStopVote.endsAt}
            myVoteIndex={nextStopVote.myVoteIndex}
            onVote={castNextStopVote}
            suggestPool={livestreams.filter(
              (l) =>
                !stops.some((s) => s.channel.slug === l.channel.slug) &&
                !nextStopVote.candidates.some((c) => c.channel.slug === l.channel.slug),
            )}
            suggestCost={SUGGEST_STOP_COST}
            kicksBalance={kicksBalance}
            onSuggest={suggestNextStop}
          />
        )}
        {moveOnVote && !moveOnVote.resolved && (
          <MoveOnVotePanel
            yes={moveOnVote.yes}
            no={moveOnVote.no}
            endsAt={moveOnVote.endsAt}
            myVote={moveOnVote.myVote}
            onVote={castMoveOnVote}
          />
        )}
        {expedition.chatVisibility === "both" && (
          <div className="flex shrink-0 border-b border-outline-decorative">
            <button
              type="button"
              onClick={() => setChatTab("explorer")}
              className={`flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                chatTab === "explorer" ? "border-b-2 border-primary-base text-white" : "text-subtle"
              }`}
            >
              Expedition Chat
            </button>
            <button
              type="button"
              onClick={() => setChatTab("stream")}
              className={`flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                chatTab === "stream" ? "border-b-2 border-primary-base text-white" : "text-subtle"
              }`}
            >
              Main Chat
            </button>
          </div>
        )}
        {expedition.chatVisibility === "expedition-only" && (
          <div className="border-b border-outline-decorative px-3 py-2">
            <h2 className="text-xs font-bold uppercase tracking-wide text-subtle">Expedition Chat</h2>
          </div>
        )}
        {expedition.chatVisibility === "main-only" && (
          <div className="border-b border-outline-decorative px-3 py-2">
            <h2 className="text-xs font-bold uppercase tracking-wide text-subtle">Main Chat · view only</h2>
          </div>
        )}
        {expedition.chatVisibility === "origin-only" && (
          <div className="flex flex-col gap-2 border-b border-outline-decorative px-3 py-2">
            <h2 className="text-xs font-bold uppercase tracking-wide text-subtle">
              {expedition.originStreamerSlug}'s Chat
            </h2>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setOriginFollowing((v) => !v)}
                className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold transition-colors ${
                  originFollowing ? "bg-secondary-base text-white" : "bg-primary-base text-primary-onPrimary"
                }`}
              >
                <Icon name={originFollowing ? "heart-filled" : "heart"} className="size-3" />
                {originFollowing ? "Following" : "Follow"}
              </button>
              <button
                type="button"
                onClick={() => setOriginSubscribed((v) => !v)}
                className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold transition-colors ${
                  originSubscribed ? "bg-primary-base text-primary-onPrimary" : "bg-secondary-base text-white"
                }`}
              >
                <Icon name="subscriptions" className="size-3" />
                {originSubscribed ? "Subscribed" : "Subscribe"}
              </button>
              <button
                type="button"
                className="flex items-center gap-1 rounded bg-secondary-base px-2 py-1 text-[11px] font-bold text-white"
              >
                <Icon name="gift" className="size-3" />
                Gift Subs
              </button>
            </div>
          </div>
        )}

        {expedition.chatVisibility === "main-only" ? (
          <ChatFeed key={current.channel.slug} readOnly injectMessage={mainChatAnnouncement} />
        ) : expedition.chatVisibility === "both" && chatTab === "stream" ? (
          <ChatFeed key={current.channel.slug} readOnly injectMessage={mainChatAnnouncement} />
        ) : expedition.chatVisibility === "origin-only" ? (
          <ChatFeed key={expedition.originStreamerSlug} />
        ) : (
          <>
            <div ref={listRef} className="no-scrollbar min-h-0 flex-1 space-y-1.5 overflow-y-auto p-3">
              {messages.map((m) =>
                m.system ? (
                  <div key={m.id} className="text-center text-[11px] italic text-subtle">
                    {m.text}
                  </div>
                ) : (
                  <div key={m.id} className="text-xs leading-relaxed">
                    <span className={`font-bold ${m.username === "you" ? "text-primary-base" : "text-white"}`}>
                      {m.username}
                    </span>
                    <span className="text-subtle">: </span>
                    <span className="text-white/90">{m.text}</span>
                  </div>
                ),
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(draft);
                setDraft("");
              }}
              className="flex shrink-0 items-center gap-2 border-t border-outline-decorative p-2"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Send a message"
                className="min-w-0 flex-1 rounded-full border border-outline-region bg-surface-base px-3 py-2 text-xs text-white outline-none placeholder:text-subtle focus:border-primary-base"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-primary-base px-3 py-2 text-xs font-bold text-primary-onPrimary"
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
