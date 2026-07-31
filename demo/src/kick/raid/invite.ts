import { liveStreamFor } from "../mock/api";
import { TIMING } from "./machine";

// The other side of a showdown: what a streamer sees when a bigger channel puts them in one. The
// host runs the raid in their own room, so this side only ever holds the decision and its outcome.
//
//   fake-kick GET    /public/v1/raids/invites
//   fake-kick POST   /public/v1/raids/{raid_id}/showdown/entries/{slug}/accept
//   fake-kick DELETE /public/v1/raids/{raid_id}/showdown/entries/{slug}
//   fake-kick raid.showdown.entry.invited, raid.showdown.entry.declined
export type InvitePhase = "pending" | "waiting" | "pitching" | "won" | "lost";

export type ShowdownInvite = {
  hostSlug: string;
  hostViewers: number;
  opponentSlug: string;
  phase: InvitePhase;
  seconds: number;
};

// How long a decided invite stays on screen before it clears itself.
const RESULT_HOLD = 10;

export function openInvite(hostSlug: string, opponentSlug: string): ShowdownInvite {
  return {
    hostSlug,
    hostViewers: liveStreamFor(hostSlug)?.viewer_count ?? 0,
    opponentSlug,
    phase: "pending",
    seconds: TIMING.accept,
  };
}

export const acceptInvite = (invite: ShowdownInvite): ShowdownInvite =>
  invite.phase === "pending" ? { ...invite, phase: "waiting", seconds: TIMING.accept } : invite;

// Section 13: the host's side of this raid is scripted, so the pitch and the vote resolve on a timer
// rather than on anything this streamer does. The result is fixed, not rolled: the showdown exists to
// hand a smaller channel a room it would never win on viewer count, so the invited streamer takes it.
export function tickInvite(invite: ShowdownInvite | null): ShowdownInvite | null {
  if (!invite) return invite;
  if (invite.seconds > 1) return { ...invite, seconds: invite.seconds - 1 };

  switch (invite.phase) {
    // Silence is not consent, so an unanswered invite lapses. It just clears, same as a decline.
    case "pending":
      return null;
    case "waiting":
      return { ...invite, phase: "pitching", seconds: TIMING.pitch };
    case "pitching":
      return { ...invite, phase: "won", seconds: RESULT_HOLD };
    default:
      return null;
  }
}

export const inviteIsDecided = (invite: ShowdownInvite) =>
  invite.phase === "won" || invite.phase === "lost";
