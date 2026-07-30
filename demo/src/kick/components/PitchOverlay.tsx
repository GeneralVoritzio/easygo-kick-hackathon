import { formatViewers, liveStreamFor } from "../mock/api";
import { useRaid } from "../raid/RaidProvider";

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

// A corner bracket, so the preview reads as a viewfinder while somebody else's room is watching.
function Corner({ at }: { at: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const place = {
    "top-left": "left-3 top-3 border-l-2 border-t-2",
    "top-right": "right-3 top-3 border-r-2 border-t-2",
    "bottom-left": "bottom-3 left-3 border-b-2 border-l-2",
    "bottom-right": "bottom-3 right-3 border-b-2 border-r-2",
  }[at];
  return <div className={`pointer-events-none absolute size-6 border-primary-base/70 ${place}`} />;
}

// The streamer's own view of a showdown they are in. The dashboard preview is the only screen they
// watch while they talk, so the state has to be readable from it: whether the room is on them yet,
// who is watching, and how long they have.
export function PitchOverlay() {
  const { invite } = useRaid();
  if (!invite || (invite.phase !== "pitching" && invite.phase !== "waiting")) return null;

  const host = liveStreamFor(invite.hostSlug);
  const hostName = host?.channel.username ?? invite.hostSlug;
  const live = invite.phase === "pitching";

  return (
    <div className="pointer-events-none absolute inset-0 z-controls">
      {live && (
        <>
          <Corner at="top-left" />
          <Corner at="top-right" />
          <Corner at="bottom-left" />
          <Corner at="bottom-right" />
        </>
      )}

      <div className="absolute left-6 top-6 flex items-center gap-2 rounded bg-surface-lowest/85 px-2.5 py-1.5 backdrop-blur-sm">
        <span
          className={`size-2.5 shrink-0 rounded-full ${
            live ? "animate-pulse-fast bg-primary-base" : "bg-subtle"
          }`}
        />
        <span className="text-sm font-bold uppercase tracking-widest text-white">
          {live ? "Pitching" : "Up next"}
        </span>
        <span className="text-sm font-bold tabular-nums text-primary-base">
          {clock(invite.seconds)}
        </span>
      </div>

      <div className="absolute inset-x-6 bottom-6 flex flex-col gap-0.5">
        <span className="text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
          {live
            ? `You are live in ${hostName}'s room, ${formatViewers(invite.hostViewers)} watching`
            : `${hostName} calls you in a moment, ${formatViewers(invite.hostViewers)} watching`}
        </span>
        <span className="text-xs text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
          {live
            ? "Say why their chat should come to you. Talk to them, not to your own room."
            : "Their chat is about to meet you. Your own stream carries on either way."}
        </span>
      </div>
    </div>
  );
}
