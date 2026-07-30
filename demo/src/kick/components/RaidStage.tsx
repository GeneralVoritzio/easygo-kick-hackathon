import type { ReactNode } from "react";
import { currentSession, currentUser, formatViewers, liveStreamFor } from "../mock/api";
import { useRaid } from "../raid/RaidProvider";
import { candidateFor, playTile, TIMING, type Raid } from "../raid/machine";
import { CountdownRing } from "./RaidChat";
import { RaidPortal } from "./RaidPortal";
import { RaidPreviewSplit } from "./RaidPreviewSplit";

export type StageFrame = { key: string; src: string; name: string; note?: string };

// The host is the current session, not a recommendation, so it never comes out of the
// candidate list.
export function frameFor(raid: Raid, slug: string): StageFrame | null {
  if (slug === raid.hostSlug) {
    const host = liveStreamFor(slug);
    return {
      key: slug,
      src: host?.thumbnail ?? currentSession.thumbnail,
      name: host?.channel.username ?? currentUser.username,
      note: `${formatViewers(raid.hostViewers)} watching`,
    };
  }
  const c = candidateFor(raid, slug);
  if (!c) return null;
  return {
    key: slug,
    src: c.stream.thumbnail,
    name: c.stream.channel.username,
    note: `${formatViewers(c.stream.viewer_count)} watching`,
  };
}

export function Frame({ frame }: { frame: StageFrame }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <img src={frame.src} alt="" className="h-full w-full object-cover brightness-125" />
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/90 to-transparent px-3 pb-2 pt-6">
        <span className="size-2 shrink-0 rounded-full bg-red-500" />
        <span className="min-w-0 truncate text-sm font-bold text-white">{frame.name}</span>
        {frame.note && (
          <span className="min-w-0 truncate text-xs text-surface-onSurfaceSecondary">
            {frame.note}
          </span>
        )}
      </div>
    </div>
  );
}

export function Stage({ caption, children }: { caption?: string; children: ReactNode }) {
  return (
    <div className="z-controls absolute inset-0 bg-black">
      {caption && (
        <div className="absolute inset-x-0 top-0 flex h-7 items-center justify-center bg-black/70 px-3">
          <span className="truncate text-xs font-semibold uppercase tracking-wide text-white">
            {caption}
          </span>
        </div>
      )}
      <div className={`h-full w-full ${caption ? "pt-7" : ""}`}>{children}</div>
    </div>
  );
}

const CORNER_CLASS =
  "pointer-events-none absolute size-2 border-primary-base/0 transition-colors duration-200 betterhover:group-hover:border-primary-base";

// A character-select screen, not a wall of thumbnails: six player cards floating over the
// stream that is still playing behind them, not a full-bleed cover. Each card is just the
// avatar; hovering lights four corner brackets, kick's targeting-frame take on a thumbnail
// hover, not a border running all the way round.
function ShowdownGrid({ raid }: { raid: Raid }) {
  const { act } = useRaid();
  const caption = `Tap a challenger to preview them for up to ${TIMING.showdownTile} seconds`;

  return (
    <div className="z-controls absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 px-4">
      <span className="max-w-md truncate rounded-full bg-black/60 px-3 py-1 text-center text-xs font-semibold uppercase tracking-wide text-white/90">
        {caption}
      </span>
      <div className="grid grid-cols-3 gap-1.5">
        {raid.candidates.slice(0, 6).map((c) => {
          const slug = c.stream.channel.slug;
          return (
            <button
              key={slug}
              type="button"
              disabled={raid.viewer}
              onClick={() => act((r) => playTile(r, slug))}
              className="group relative size-11 overflow-hidden rounded bg-surface-highest disabled:cursor-default sm:size-14"
            >
              <img
                src={c.stream.channel.avatar}
                alt={c.stream.channel.username}
                className="h-full w-full object-cover"
              />
              <span className={`${CORNER_CLASS} left-0.5 top-0.5 border-l-2 border-t-2`} />
              <span className={`${CORNER_CLASS} right-0.5 top-0.5 border-r-2 border-t-2`} />
              <span className={`${CORNER_CLASS} bottom-0.5 left-0.5 border-b-2 border-l-2`} />
              <span className={`${CORNER_CLASS} bottom-0.5 right-0.5 border-b-2 border-r-2`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TwoUp({
  raid,
  slugs,
  timerIndex,
  timerSeconds,
  timerTotal,
}: {
  raid: Raid;
  slugs: string[];
  timerIndex?: number;
  timerSeconds?: number;
  timerTotal?: number;
}) {
  const frames = slugs.map((slug) => frameFor(raid, slug)).filter((f) => f !== null);
  return (
    <Stage>
      <div className="grid h-full w-full grid-cols-2 gap-0.5">
        {frames.map((frame, i) => (
          <div key={frame.key} className="relative h-full w-full">
            <Frame frame={frame} />
            {i === timerIndex && (
              <>
                <span className="pointer-events-none absolute left-2 top-2 size-5 border-l-[3px] border-t-[3px] border-primary-base" />
                <span className="pointer-events-none absolute right-2 top-2 size-5 border-r-[3px] border-t-[3px] border-primary-base" />
                <span className="pointer-events-none absolute bottom-2 left-2 size-5 border-b-[3px] border-l-[3px] border-primary-base" />
                <span className="pointer-events-none absolute bottom-2 right-2 size-5 border-b-[3px] border-r-[3px] border-primary-base" />
              </>
            )}
            {i === timerIndex && timerSeconds !== undefined && timerTotal !== undefined && (
              <div className="pointer-events-none absolute left-1/2 top-2 flex size-9 shrink-0 -translate-x-1/2 items-center justify-center">
                <CountdownRing seconds={timerSeconds} total={timerTotal} size={36} />
                <span className="relative text-[11px] font-black tabular-nums text-white">
                  {timerSeconds}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Stage>
  );
}

// Section 5.1: every preview plays in the player, and a stream never renders in the chat
// column. The pitch is two player embeds side by side in the viewer's own browser, so it is
// never a co-stream and never described as one.
export function RaidStage() {
  const { raid, preview } = useRaid();

  if (!raid) {
    const stream = preview ? liveStreamFor(preview) : undefined;
    if (!stream) return null;
    return (
      <Stage caption="Preview">
        <Frame
          frame={{
            key: stream.channel.slug,
            src: stream.thumbnail,
            name: stream.channel.username,
            note: stream.session_title,
          }}
        />
      </Stage>
    );
  }

  if (raid.phase === "showdown-pitch")
    return (
      <TwoUp
        raid={raid}
        slugs={[raid.hostSlug, raid.finalists[raid.pitchIndex]]}
        timerIndex={1}
        timerSeconds={raid.seconds}
        timerTotal={TIMING.pitch}
      />
    );

  if (raid.phase === "vote" && raid.poll?.round === 2)
    return <TwoUp raid={raid} slugs={raid.finalists} />;

  if (raid.phase === "showdown-browse" && !raid.stage) return <ShowdownGrid raid={raid} />;

  // Chat pick previews split against the host, Section 5.1. A showdown pick does the same
  // versus split; its own timer running out clears raid.stage and returns to the character
  // select grid above, not a fresh screen.
  const staged = raid.stage ? candidateFor(raid, raid.stage) : undefined;
  if (staged && raid.phase === "preview") {
    return <RaidPreviewSplit raid={raid} candidate={staged} total={TIMING.chatPreview} />;
  }
  if (staged && raid.phase === "showdown-browse") {
    return <RaidPreviewSplit raid={raid} candidate={staged} total={TIMING.showdownTile} />;
  }

  // Section 5.2: the handoff itself, the countdown growing into the raid landing, plays as one
  // overlay over the player instead of a caption swap, so it reads as the raid pulling chat
  // through rather than the page cutting to a new screen.
  if (raid.phase === "countdown" || raid.phase === "landed") {
    return <RaidPortal raid={raid} />;
  }

  return null;
}
