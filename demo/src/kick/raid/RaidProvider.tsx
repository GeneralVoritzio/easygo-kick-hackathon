import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { currentSession, currentUser, type Livestream } from "../mock/api";
import { recordRaid, type Candidate } from "../mock/raids";
import { isHidden, usePrefs } from "../prefs";
import {
  acceptEntry,
  addChatVotes,
  advance,
  canReroll,
  candidateFor,
  declineEntry,
  justRaidThem,
  openTankVote,
  playTile,
  startRaid,
  tryAnother,
  type Raid,
  type RaidMode,
} from "./machine";

export type DialogKind = "raid" | "end";

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
  start: (mode: RaidMode, pickedSlug?: string) => void;
  startAsViewer: (host: Livestream, mode: RaidMode) => void;
  act: (fn: (raid: Raid) => Raid) => void;
  join: () => void;
  leave: () => void;
  clear: () => void;
  targetIsHidden: boolean;
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

export function RaidProvider({ children }: { children: ReactNode }) {
  const [raid, setRaid] = useState<Raid | null>(null);
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [joined, setJoined] = useState<boolean | null>(null);
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

  // Section 13: the demo forces the tank acceptances on cue. The logic is real, the timing
  // is scripted. The first reroll is where the fork is shown, so after it everybody accepts.
  const accepting = raid?.phase === "tank-accept";
  const finalists = raid?.finalists.join() ?? "";
  useEffect(() => {
    if (!accepting) return;
    const [first, second] = finalists.split(",");
    const timers = [
      setTimeout(() => setRaid((r) => (r ? acceptEntry(r, first) : r)), 5000),
      setTimeout(
        () => setRaid((r) => (r ? (r.rerolls === 0 ? declineEntry : acceptEntry)(r, second) : r)),
        11000,
      ),
    ];
    return () => timers.forEach(clearTimeout);
  }, [accepting, finalists]);

  // Section 13: on the viewer side the streamer is not in the room, so their decisions are
  // scripted too. A viewer never sees the controls that make them.
  const viewerPhase = raid?.viewer ? raid.phase : null;
  useEffect(() => {
    if (viewerPhase === "tank-browse") {
      const tiles = [2000, 4000].map((at, i) =>
        setTimeout(() => setRaid((r) => (r ? playTile(r, r.candidates[i].stream.channel.slug) : r)), at),
      );
      const vote = setTimeout(() => setRaid((r) => (r ? openTankVote(r) : r)), 7000);
      return () => [...tiles, vote].forEach(clearTimeout);
    }
    if (viewerPhase === "tank-fork") {
      const id = setTimeout(
        () => setRaid((r) => (r ? (canReroll(r) && r.rerolls === 0 ? tryAnother : justRaidThem)(r) : r)),
        4000,
      );
      return () => clearTimeout(id);
    }
  }, [viewerPhase]);

  const landed = raid?.phase === "landed";
  useEffect(() => {
    if (!landed) return;
    setRaid((r) => {
      if (!r?.targetSlug) return r;
      const winner = candidateFor(r, r.targetSlug);
      const featured = r.featured.map((s) => candidateFor(r, s)).filter(Boolean) as Candidate[];
      if (winner) recordRaid(winner, featured, r.hostViewers);
      return r;
    });
  }, [landed]);

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
    start: (mode, pickedSlug) => {
      setJoined(null);
      setRaid(
        startRaid({
          mode,
          hostSlug: currentUser.slug,
          hostViewers: currentSession.viewer_count,
          pickedSlug,
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
  };

  return <RaidContext.Provider value={api}>{children}</RaidContext.Provider>;
}
