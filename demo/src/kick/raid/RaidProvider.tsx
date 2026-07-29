import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { currentSession, currentUser, type Livestream } from "../mock/api";
import { isHidden, usePrefs } from "../prefs";
import { addBreakVotes, chooseBreak as chooseBreakPure, startBreak as startBreakPure, type Break } from "./break";
import {
  acceptEntry,
  addChatVotes,
  advance,
  candidateFor,
  playTile,
  startRaid,
  type Raid,
  type RaidMode,
} from "./machine";

export type DialogKind = "raid" | "end" | "break";

type RaidApi = {
  raid: Raid | null;
  dialog: DialogKind | null;
  // Section 5.1: selecting a channel in the dialog plays it in the player, never in the dialog.
  preview: string | null;
  setPreview: (slug: string | null) => void;
  // null until the viewer decides. At zero an undecided viewer is carried unless the
  // destination is in a category they hid.
  joined: boolean | null;
  hostViewers: number;
  hostSlug: string;
  openDialog: (kind: DialogKind) => void;
  dismissDialog: () => void;
  start: (mode: RaidMode, pickedSlug?: string, pickedSlugs?: string[]) => void;
  startAsViewer: (host: Livestream, mode: RaidMode) => void;
  act: (fn: (raid: Raid) => Raid) => void;
  join: () => void;
  leave: () => void;
  clear: () => void;
  targetIsHidden: boolean;
  breakRaid: Break | null;
  breakNotice: string | null;
  startBreak: (options: string[], duration: number) => void;
  startBreakAsViewer: (host: Livestream, options: string[], duration: number) => void;
  chooseBreak: (choice: string | null) => void;
  endBreak: () => void;
  dismissBreak: () => void;
};

const RaidContext = createContext<RaidApi | null>(null);

export const useRaid = () => {
  const api = useContext(RaidContext);
  if (!api) throw new Error("useRaid needs a RaidProvider");
  return api;
};

const tick = (raid: Raid | null) => {
  if (!raid || raid.seconds <= 0) return raid;
  return raid.seconds > 1 ? { ...raid, seconds: raid.seconds - 1 } : advance({ ...raid, seconds: 0 });
};

const TICKS_PER_VOTE = 25;

// The votes are simulated, not typed. The weight is the candidate's own score, so the poll
// behaves like a chat that broadly agrees with the ranking without ever matching it.
function simulateVotes(raid: Raid) {
  const poll = raid.poll;
  if (!poll) return raid;
  const weights = poll.options.map((slug) => candidateFor(raid, slug)?.score ?? 0.5);
  const total = weights.reduce((sum, w) => sum + w, 0);
  const batch = Math.round((raid.hostViewers * 0.35) / TICKS_PER_VOTE);
  const votes: Record<string, number> = {};
  for (let i = 0; i < batch; i++) {
    let roll = Math.random() * total;
    const index = weights.findIndex((w) => (roll -= w) <= 0);
    const slug = poll.options[Math.max(0, index)];
    votes[slug] = (votes[slug] ?? 0) + 1;
  }
  return addChatVotes(raid, votes);
}

const BREAK_TICKS_PER_VOTE = 20;

// A break is optional, so only a slice of chat ever wanders off, unlike a raid's forced sweep.
// Weights are even across the streamer's three picks, since there is no host-affinity score
// to lean on the way a raid vote has.
function simulateBreakVotes(b: Break, hostViewers: number) {
  const batch = Math.round((hostViewers * 0.08) / BREAK_TICKS_PER_VOTE);
  if (batch <= 0) return b;
  const votes: Record<string, number> = {};
  for (let i = 0; i < batch; i++) {
    const slug = b.options[Math.floor(Math.random() * b.options.length)];
    votes[slug] = (votes[slug] ?? 0) + 1;
  }
  return addBreakVotes(b, votes);
}

export function RaidProvider({ children }: { children: ReactNode }) {
  const [raid, setRaid] = useState<Raid | null>(null);
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [joined, setJoined] = useState<boolean | null>(null);
  const [breakRaid, setBreakRaid] = useState<Break | null>(null);
  const [breakNotice, setBreakNotice] = useState<string | null>(null);
  const [prefs] = usePrefs();

  useEffect(() => {
    const id = setInterval(() => setRaid(tick), 1000);
    return () => clearInterval(id);
  }, []);

  const voting = raid?.phase === "vote";
  useEffect(() => {
    if (!voting) return;
    const id = setInterval(() => setRaid((r) => (r?.poll ? simulateVotes(r) : r)), 800);
    return () => clearInterval(id);
  }, [voting, raid?.poll?.round, raid?.poll?.slot]);

  // Section 13: the demo forces the tank acceptances on cue. The logic is real, the timing is
  // scripted: both finalists accept, staggered, so the invite panel is visible mid-decision
  // before the accept timer runs out and carries the raid into the pitch.
  const accepting = raid?.phase === "tank-accept";
  const finalists = raid?.finalists.join() ?? "";
  useEffect(() => {
    if (!accepting || !raid) return;
    const pending = raid.finalists.filter((s) => !raid.accepted.includes(s));
    const timers = pending.map((slug, i) =>
      setTimeout(() => setRaid((r) => (r ? acceptEntry(r, slug) : r)), 3000 + i * 3000),
    );
    return () => timers.forEach(clearTimeout);
  }, [accepting, finalists]);

  // Section 13: on the viewer side the streamer is not in the room, so their decisions are
  // scripted too. A viewer never sees the controls that make them.
  const viewerPhase = raid?.viewer ? raid.phase : null;
  useEffect(() => {
    if (viewerPhase !== "tank-browse") return;
    // The vote itself opens off the real browse timer, same as the streamer's own raid, so
    // this only simulates the streamer glancing through a couple of tiles while it runs.
    const tiles = [2000, 4000].map((at, i) =>
      setTimeout(() => setRaid((r) => (r ? playTile(r, r.candidates[i].stream.channel.slug) : r)), at),
    );
    return () => tiles.forEach(clearTimeout);
  }, [viewerPhase]);

  // A break is a plain countdown, no phase machine: tick it down, and a separate effect below
  // ends it the instant it reaches zero.
  useEffect(() => {
    const id = setInterval(() => {
      setBreakRaid((b) => (b && b.seconds > 0 ? { ...b, seconds: b.seconds - 1 } : b));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const breakVoting = Boolean(breakRaid) && !breakRaid?.ended;
  useEffect(() => {
    if (!breakVoting) return;
    const id = setInterval(
      () => setBreakRaid((b) => (b ? simulateBreakVotes(b, currentSession.viewer_count) : b)),
      800,
    );
    return () => clearInterval(id);
  }, [breakVoting]);

  function endBreak() {
    // Read from the render-time closure, not from inside the setBreakRaid updater: Strict
    // Mode double-invokes updaters, and setBreakNotice/setTimeout are side effects that must
    // only fire once per real end.
    if (breakRaid?.myChoice) {
      setBreakNotice(`${currentUser.username} is back. Bringing you back...`);
      setTimeout(() => setBreakNotice(null), 4000);
    }
    // Section 5.2-style: like a landed raid, this stays around as an "ended" card in chat
    // instead of vanishing, until the viewer dismisses it themselves.
    setBreakRaid((b) => (b ? { ...b, ended: true, seconds: 0 } : b));
  }

  const breakEnded = breakRaid?.seconds === 0;
  useEffect(() => {
    if (!breakEnded) return;
    endBreak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakEnded]);

  const target = raid?.targetSlug ? candidateFor(raid, raid.targetSlug) : undefined;
  const targetIsHidden = Boolean(target && isHidden(target.stream.category.slug, prefs));

  const api: RaidApi = {
    raid,
    dialog,
    preview,
    setPreview,
    joined,
    hostViewers: currentSession.viewer_count,
    hostSlug: currentUser.slug,
    targetIsHidden,
    openDialog: setDialog,
    dismissDialog: () => {
      // Section 4.1: Random is the fallback, so a dismissed end-of-stream prompt still
      // hands the viewers on.
      if (dialog === "end" && prefs.autoRaid && !raid) {
        setRaid(
          startRaid({
            mode: "random",
            hostSlug: currentUser.slug,
            hostViewers: currentSession.viewer_count,
          }),
        );
      }
      setDialog(null);
    },
    start: (mode, pickedSlug, pickedSlugs) => {
      setJoined(null);
      setRaid(
        startRaid({
          mode,
          hostSlug: currentUser.slug,
          hostViewers: currentSession.viewer_count,
          pickedSlug,
          pickedSlugs,
        }),
      );
      setDialog(null);
    },
    startAsViewer: (host, mode) => {
      setJoined(null);
      setPreview(null);
      setRaid(
        startRaid({
          mode,
          hostSlug: host.channel.slug,
          hostViewers: host.viewer_count,
          viewer: true,
        }),
      );
    },
    act: (fn) => setRaid((r) => (r ? fn(r) : r)),
    join: () => setJoined(true),
    leave: () => setJoined(false),
    clear: () => setRaid(null),
    breakRaid,
    breakNotice,
    startBreak: (options, duration) => {
      setBreakRaid(startBreakPure(currentUser.slug, options, duration));
      setDialog(null);
    },
    startBreakAsViewer: (host, options, duration) => {
      setBreakRaid(startBreakPure(host.channel.slug, options, duration));
    },
    chooseBreak: (choice) => setBreakRaid((b) => (b ? chooseBreakPure(b, choice) : b)),
    endBreak,
    dismissBreak: () => setBreakRaid(null),
  };

  return <RaidContext.Provider value={api}>{children}</RaidContext.Provider>;
}
