import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { currentSession, currentUser, type Livestream } from "../mock/api";
import { joinsShowdowns } from "../mock/raids";
import { isHidden, usePrefs } from "../prefs";
import { acceptInvite, openInvite, tickInvite, type ShowdownInvite } from "./invite";
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

export type DialogKind = "raid" | "end";

type RaidApi = {
  raid: Raid | null;
  // A showdown somebody else runs, which this streamer has been put into.
  invite: ShowdownInvite | null;
  inviteShowdown: () => void;
  answerInvite: (accepted: boolean) => void;
  clearInvite: () => void;
  // The pitch window is a minute, which nobody wants to sit through in a demo.
  skipInvite: () => void;
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
  // Section 4.1: ends the stream. Never starts a raid on its own, it only closes the dialog.
  endStream: () => void;
  start: (mode: RaidMode, pickedSlug?: string, pickedSlugs?: string[]) => void;
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

// Who puts this streamer in a showdown. IronVow is the biggest channel the demo follows, and
// CapeQuest is the other finalist, so the invite reads as a big room choosing between two small ones.
const INVITE_HOST_SLUG = "ironvow";
const INVITE_OPPONENT_SLUG = "capequest";

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
  const [invite, setInvite] = useState<ShowdownInvite | null>(null);
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [joined, setJoined] = useState<boolean | null>(null);
  const [prefs] = usePrefs();

  useEffect(() => {
    const id = setInterval(() => {
      setRaid(tick);
      setInvite(tickInvite);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const voting = raid?.phase === "vote";
  useEffect(() => {
    if (!voting) return;
    const id = setInterval(() => setRaid((r) => (r?.poll ? simulateVotes(r) : r)), 800);
    return () => clearInterval(id);
  }, [voting, raid?.poll?.round, raid?.poll?.slot]);

  // Section 13: the demo forces the showdown acceptances on cue. The logic is real, the timing
  // is scripted: both finalists accept, staggered, so the invite panel is visible mid-decision
  // before the accept timer runs out and carries the raid into the pitch.
  const accepting = raid?.phase === "showdown-accept";
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
    if (viewerPhase !== "showdown-browse") return;
    // The vote itself opens off the real browse timer, same as the streamer's own raid, so
    // this only simulates the streamer glancing through a couple of tiles while it runs.
    const tiles = [2000, 4000].map((at, i) =>
      setTimeout(() => setRaid((r) => (r ? playTile(r, r.candidates[i].stream.channel.slug) : r)), at),
    );
    return () => tiles.forEach(clearTimeout);
  }, [viewerPhase]);

  const target = raid?.targetSlug ? candidateFor(raid, raid.targetSlug) : undefined;
  const targetIsHidden = Boolean(target && isHidden(target.stream.category.slug, prefs));

  const api: RaidApi = {
    raid,
    invite,
    // Section 10: the consent toggle gates this, so an invite cannot arrive for a streamer who
    // turned showdowns off.
    inviteShowdown: () => {
      if (!joinsShowdowns(currentUser.slug)) return;
      setInvite(openInvite(INVITE_HOST_SLUG, INVITE_OPPONENT_SLUG));
    },
    // Declining just dismisses the invite, same as the timeout that lapses it.
    answerInvite: (accepted) => setInvite((i) => (i ? (accepted ? acceptInvite(i) : null) : i)),
    clearInvite: () => setInvite(null),
    skipInvite: () => setInvite((i) => (i ? { ...i, seconds: 1 } : i)),
    dialog,
    preview,
    setPreview,
    joined,
    hostViewers: currentSession.viewer_count,
    hostSlug: currentUser.slug,
    targetIsHidden,
    openDialog: setDialog,
    // Section 4.1: ending the stream, or dismissing the dialog, never starts a raid on its
    // own. Both just close whatever raid UI is open.
    dismissDialog: () => setDialog(null),
    endStream: () => setDialog(null),
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
  };

  return <RaidContext.Provider value={api}>{children}</RaidContext.Provider>;
}
