import { formatViewers, liveStreamFor } from "../mock/api";
import { useRaid } from "../raid/RaidProvider";

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

// A corner bracket at the edge of the screen, so the whole window reads as the viewfinder.
function Corner({ at }: { at: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const place = {
    "top-left": "left-4 top-4 border-l-2 border-t-2",
    "top-right": "right-4 top-4 border-r-2 border-t-2",
    "bottom-left": "bottom-4 left-4 border-b-2 border-l-2",
    "bottom-right": "bottom-4 right-4 border-b-2 border-r-2",
  }[at];
  return <div className={`absolute size-10 border-primary-base ${place}`} />;
}

// The streamer's own view of a showdown they are in. It takes the whole window, because a streamer
// talking to somebody else's chat is not looking at one panel: they need to know from any glance that
// the room is on them, who is watching, and how long they have.
export function PitchOverlay() {
  const { invite } = useRaid();
  if (!invite || (invite.phase !== "pitching" && invite.phase !== "waiting")) return null;

  const host = liveStreamFor(invite.hostSlug);
  const hostName = host?.channel.username ?? invite.hostSlug;
  const live = invite.phase === "pitching";

  return (
    <div className="pointer-events-none fixed inset-0 z-[400]">
      {/* The green edge is the whole effect: it frames the screen without hiding any of it. */}
      <div
        className={`absolute inset-0 border-2 transition-colors ${
          live
            ? "border-primary-base shadow-[inset_0_0_140px_rgba(83,252,24,0.16)]"
            : "border-primary-base/40"
        }`}
      />
      {live && (
        <>
          <Corner at="top-left" />
          <Corner at="top-right" />
          <Corner at="bottom-left" />
          <Corner at="bottom-right" />
        </>
      )}

      {/* One cluster at the top, because the bottom of this page is the chat input and the demo
          controls. */}
      <div className="absolute inset-x-0 top-4 flex flex-col items-center gap-2 px-16">
        <div className="flex items-center gap-2.5 rounded-full border border-primary-base/50 bg-surface-lowest/90 px-4 py-2 shadow-2xl backdrop-blur-sm">
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

        <div className="flex max-w-[640px] flex-col items-center gap-0.5 rounded-lg bg-surface-lowest/90 px-4 py-2.5 text-center shadow-2xl backdrop-blur-sm">
          <span className="text-sm font-bold text-white">
            {live
              ? `You are live in ${hostName}'s room, ${formatViewers(invite.hostViewers)} watching`
              : `${hostName} calls you in a moment, ${formatViewers(invite.hostViewers)} watching`}
          </span>
          <span className="text-xs text-surface-onSurfaceSecondary">
            {live
              ? "Say why their chat should come to you. Talk to them, not to your own room."
              : "Their chat is about to meet you. Your own stream carries on either way."}
          </span>
        </div>
      </div>
    </div>
  );
}
